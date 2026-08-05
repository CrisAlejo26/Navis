import { Injectable } from '@nestjs/common';
import {
  DEFAULT_DREAM_SORT,
  DEFAULT_PAGE_SIZE,
  type DreamListItem,
  type DreamsQuery,
  type Paginated,
} from '@navis/shared';

import { DreamEmotionsRepository } from './dream-emotions.repository';
import { DreamRowsService } from './dream-rows.service';
import { applyFilters, applyOrder } from './dreams-filter';
import { DreamsRepository } from './dreams.repository';

/** El listado paginado, con sus filtros y su orden (RFC 0005 §6.1). */
@Injectable()
export class DreamsPageService {
  constructor(
    private readonly dreams: DreamsRepository,
    private readonly links: DreamEmotionsRepository,
    private readonly rows: DreamRowsService,
  ) {}

  async list(ownerId: string, query: DreamsQuery): Promise<Paginated<DreamListItem>> {
    const page = Math.max(1, query.page ?? 1);
    const limit = query.limit ?? DEFAULT_PAGE_SIZE;

    const emotions = query.emotion ?? [];
    const emotionDreamIds = emotions.length > 0 ? await this.links.dreamIdsWith(emotions) : null;

    const builder = this.dreams.scoped(ownerId);
    applyFilters(builder, query, emotionDreamIds);
    applyOrder(builder, query.sort ?? DEFAULT_DREAM_SORT, query.order ?? 'desc');

    // Sin relaciones cargadas: con ellas, `take`/`skip` pasan a una subconsulta
    // con `DISTINCT` y Postgres exige que lo ordenado esté seleccionado
    // (CLAUDE.md). Emociones y audios se piden aparte, ya con los ids de la
    // página.
    const [rows, total] = await builder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      items: await this.rows.listItems(ownerId, rows),
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }
}
