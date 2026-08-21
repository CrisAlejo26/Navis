import { Injectable } from '@nestjs/common';
import {
  DEFAULT_PAGE_SIZE,
  DEFAULT_TEACHING_SORT,
  type Paginated,
  type TeachingListItem,
  type TeachingsQuery,
} from '@navis/shared';

import { applyTeachingFilters, applyTeachingOrder } from './teachings-filter';
import { toListItem } from './teachings.mapper';
import { TeachingsRepository } from './teachings.repository';

/** El listado paginado, con su búsqueda y su orden (RFC 0022 §4.4). */
@Injectable()
export class TeachingsPageService {
  constructor(private readonly teachings: TeachingsRepository) {}

  async list(ownerId: string, query: TeachingsQuery): Promise<Paginated<TeachingListItem>> {
    const page = Math.max(1, query.page ?? 1);
    const limit = query.limit ?? DEFAULT_PAGE_SIZE;

    const builder = this.teachings.scoped(ownerId);
    applyTeachingFilters(builder, query.search);
    applyTeachingOrder(builder, query.sort ?? DEFAULT_TEACHING_SORT, query.order ?? 'desc');

    const [rows, total] = await builder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      items: rows.map(toListItem),
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }
}
