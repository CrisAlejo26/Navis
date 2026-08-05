import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  DEFAULT_BELIEVER_SORT,
  EXPORT_MAX_ROWS,
  type BelieverExportRow,
  type BelieversQuery,
  type ExportResponse,
  type ExportSelection,
  type IsoDate,
} from '@navis/shared';
import { Repository } from 'typeorm';

import { nullsFor } from '../database/date-sql';
import { BelieverRowsService } from './believer-rows.service';
import { Believer } from './believer.entity';
import { applyFilters, SORT_COLUMN } from './believers-filter';

export type BelieversExportQuery = BelieversQuery & ExportSelection;

/** Cuando no hay nada que exportar, la forma es la misma y los ceros también. */
const EMPTY: ExportResponse<BelieverExportRow> = {
  rows: [],
  total: 0,
  returned: 0,
  truncated: false,
};

/**
 * Las filas del listado **sin paginar**, para llevárselas a un fichero
 * (RFC 0009 §6).
 *
 * Reutiliza el filtro y el orden del listado (`believers-filter.ts`) y la
 * hidratación de `BelieverRowsService`: lo único propio es que aquí no hay
 * página, hay un tope, y hay una selección que puede mandar sobre todo lo
 * demás.
 */
@Injectable()
export class BelieversExportService {
  constructor(
    @InjectRepository(Believer) private readonly believers: Repository<Believer>,
    private readonly rows: BelieverRowsService,
  ) {}

  async export(
    churchId: string,
    query: BelieversExportQuery,
    today: IsoDate,
  ): Promise<ExportResponse<BelieverExportRow>> {
    const selection = query.ids;
    // Un `IN ('')` contra una columna `uuid` revienta en Postgres (CLAUDE.md).
    const ids = [...new Set(selection ?? [])].filter(Boolean);

    // Con selección vacía **no** se cae en «pues entonces todo»: quien marcó
    // filas y las desmarcó no espera que le salgan las doscientas trece.
    if (selection !== undefined && ids.length === 0) return EMPTY;

    const order = query.order === 'asc' ? 'ASC' : 'DESC';
    const sort = query.sort ?? DEFAULT_BELIEVER_SORT;

    const builder = this.believers
      .createQueryBuilder('believer')
      .where('believer.churchId = :churchId', { churchId });

    // La selección manda y lo demás se ignora (D1): es lo que hace que el
    // diálogo pueda decir «12 seleccionados» y no mentir.
    if (ids.length > 0) builder.andWhere('believer.id IN (:...ids)', { ids });
    else applyFilters(builder, query, today);

    builder
      .orderBy(SORT_COLUMN[sort], order, nullsFor(order))
      .addOrderBy('believer.searchName', 'ASC')
      .limit(EXPORT_MAX_ROWS);

    // `getManyAndCount` cuenta **sin** el límite, que es justo lo que hace
    // falta para poder decir «2000 de 3140» en vez de enseñar 2000 y callarse.
    const [people, total] = await builder.getManyAndCount();

    return {
      rows: await this.rows.of(churchId, people, today),
      total,
      returned: people.length,
      truncated: total > people.length,
    };
  }
}
