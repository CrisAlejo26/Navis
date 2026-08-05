import { Injectable } from '@nestjs/common';
import {
  DEFAULT_PROPHECY_SORT,
  EXPORT_MAX_ROWS,
  type ExportResponse,
  type ExportSelection,
  type PropheciesQuery,
  type ProphecyExportRow,
} from '@navis/shared';

import { toIsoDay } from '../database/iso-day';
import { PropheciesRepository } from './prophecies.repository';
import { applyFilters, applyOrder } from './prophecies-filter';
import { ProphecyRowsService } from './prophecy-rows.service';

export type PropheciesExportQuery = PropheciesQuery & ExportSelection;

const EMPTY: ExportResponse<ProphecyExportRow> = {
  rows: [],
  total: 0,
  returned: 0,
  truncated: false,
};

/**
 * Las profecías del filtro **sin paginar**, para llevárselas a un fichero
 * (RFC 0009 §6).
 *
 * Como todo lo de este módulo, sale de `PropheciesRepository.scoped(ownerId)`:
 * es la única barrera de acceso que hay (RFC 0004 D1) y por eso ningún
 * servicio de aquí toca el repositorio de TypeORM directamente.
 */
@Injectable()
export class PropheciesExportService {
  constructor(
    private readonly prophecies: PropheciesRepository,
    private readonly rows: ProphecyRowsService,
  ) {}

  async export(
    ownerId: string,
    query: PropheciesExportQuery,
  ): Promise<ExportResponse<ProphecyExportRow>> {
    const selection = query.ids;
    // Un `IN ('')` contra una columna `uuid` revienta en Postgres (CLAUDE.md).
    const ids = [...new Set(selection ?? [])].filter(Boolean);

    // Con selección vacía **no** se cae en «pues entonces todo».
    if (selection !== undefined && ids.length === 0) return EMPTY;

    const today = toIsoDay(new Date());
    const builder = this.prophecies.scoped(ownerId);

    // La selección manda y lo demás se ignora (D1).
    if (ids.length > 0) builder.andWhere('prophecy.id IN (:...ids)', { ids });
    else applyFilters(builder, query, today);

    applyOrder(builder, query.sort ?? DEFAULT_PROPHECY_SORT, query.order ?? 'desc');

    // `getManyAndCount` cuenta **sin** el límite: es lo que permite decir
    // «2000 de 3140» en vez de enseñar 2000 y callarse.
    const [found, total] = await builder.take(EXPORT_MAX_ROWS).getManyAndCount();

    return {
      rows: await this.rows.exportRows(found, today),
      total,
      returned: found.length,
      truncated: total > found.length,
    };
  }
}
