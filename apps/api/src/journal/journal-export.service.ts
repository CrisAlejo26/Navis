import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  DEFAULT_JOURNAL_SORT,
  EXPORT_MAX_ROWS,
  type ExportResponse,
  type ExportSelection,
  type JournalExportRow,
  type JournalQuery,
} from '@navis/shared';
import { Repository } from 'typeorm';

import { toIsoDay } from '../database/iso-day';
import { applyFilters, applyOrder } from './journal-filter';
import { JournalEntriesViewService } from './journal-entries-view.service';
import { JournalEntry } from './journal-entry.entity';

export type JournalExportQuery = JournalQuery & ExportSelection;

const EMPTY: ExportResponse<JournalExportRow> = {
  rows: [],
  total: 0,
  returned: 0,
  truncated: false,
};

/**
 * Las entradas del filtro **sin paginar**, para llevárselas a Markdown (D12).
 *
 * Church-scoped por lo de siempre en este módulo: `churchId` llega de
 * `ActiveChurchGuard` y se comprueba en la propia consulta, no en un
 * repositorio aparte —aquí sí hay permisos de rol, al revés que las profecías.
 */
@Injectable()
export class JournalExportService {
  constructor(
    @InjectRepository(JournalEntry) private readonly entries: Repository<JournalEntry>,
    private readonly view: JournalEntriesViewService,
  ) {}

  async export(
    churchId: string,
    query: JournalExportQuery,
  ): Promise<ExportResponse<JournalExportRow>> {
    const selection = query.ids;
    // Un `IN ('')` contra una columna `uuid` revienta en Postgres (CLAUDE.md).
    const ids = [...new Set(selection ?? [])].filter(Boolean);

    // Con selección vacía **no** se cae en «pues entonces todo».
    if (selection !== undefined && ids.length === 0) return EMPTY;

    const today = toIsoDay(new Date());
    const builder = this.entries
      .createQueryBuilder('entry')
      .where('entry.churchId = :churchId', { churchId });

    // La selección manda y lo demás se ignora, como en la RFC 0009.
    if (ids.length > 0) builder.andWhere('entry.id IN (:...ids)', { ids });
    else applyFilters(builder, query, today);

    applyOrder(builder, query.sort ?? DEFAULT_JOURNAL_SORT, query.order ?? 'desc');

    // `getManyAndCount` cuenta **sin** el límite: es lo que permite decir
    // «2000 de 3140» en vez de enseñar 2000 y callarse.
    const [found, total] = await builder.take(EXPORT_MAX_ROWS).getManyAndCount();

    return {
      rows: await this.view.exportRows(found),
      total,
      returned: found.length,
      truncated: total > found.length,
    };
  }
}
