import { Injectable } from '@nestjs/common';
import {
  DEFAULT_DREAM_SORT,
  EXPORT_MAX_ROWS,
  type DreamExportRow,
  type DreamsQuery,
  type ExportResponse,
  type ExportSelection,
} from '@navis/shared';

import { DreamEmotionsRepository } from './dream-emotions.repository';
import { DreamRowsService } from './dream-rows.service';
import { applyFilters, applyOrder } from './dreams-filter';
import { DreamsRepository } from './dreams.repository';

export type DreamsExportQuery = DreamsQuery & ExportSelection;

const EMPTY: ExportResponse<DreamExportRow> = {
  rows: [],
  total: 0,
  returned: 0,
  truncated: false,
};

/**
 * Los sueños del filtro **sin paginar**, para llevárselos a un fichero
 * (RFC 0009 §6).
 *
 * Como todo lo de este módulo sale de `DreamsRepository.scoped(ownerId)`, que
 * es la única barrera de acceso que hay (RFC 0005 D1).
 */
@Injectable()
export class DreamsExportService {
  constructor(
    private readonly dreams: DreamsRepository,
    private readonly links: DreamEmotionsRepository,
    private readonly rows: DreamRowsService,
  ) {}

  async export(ownerId: string, query: DreamsExportQuery): Promise<ExportResponse<DreamExportRow>> {
    const selection = query.ids;
    // Un `IN ('')` contra una columna `uuid` revienta en Postgres (CLAUDE.md).
    const ids = [...new Set(selection ?? [])].filter(Boolean);

    // Con selección vacía **no** se cae en «pues entonces todo».
    if (selection !== undefined && ids.length === 0) return EMPTY;

    const builder = this.dreams.scoped(ownerId);

    // La selección manda y lo demás se ignora (D1).
    if (ids.length > 0) {
      builder.andWhere('dream.id IN (:...ids)', { ids });
    } else {
      const emotions = query.emotion ?? [];
      const emotionDreamIds = emotions.length > 0 ? await this.links.dreamIdsWith(emotions) : null;
      applyFilters(builder, query, emotionDreamIds);
    }

    applyOrder(builder, query.sort ?? DEFAULT_DREAM_SORT, query.order ?? 'desc');

    // `getManyAndCount` cuenta **sin** el límite: es lo que permite decir
    // «2000 de 3140» en vez de enseñar 2000 y callarse.
    const [found, total] = await builder.take(EXPORT_MAX_ROWS).getManyAndCount();

    return {
      rows: await this.rows.exportRows(ownerId, found),
      total,
      returned: found.length,
      truncated: total > found.length,
    };
  }
}
