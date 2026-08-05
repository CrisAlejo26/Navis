import { Injectable } from '@nestjs/common';
import {
  DEFAULT_PAGE_SIZE,
  DEFAULT_PROPHECY_SORT,
  type Paginated,
  type PropheciesQuery,
  type ProphecyListItem,
} from '@navis/shared';

import { toIsoDay } from '../database/iso-day';
import { PropheciesRepository } from './prophecies.repository';
import { applyFilters, applyOrder } from './prophecies-filter';
import { ProphecyRowsService } from './prophecy-rows.service';

/** El listado paginado, con sus filtros y su orden (RFC 0004 §6.1). */
@Injectable()
export class PropheciesPageService {
  constructor(
    private readonly prophecies: PropheciesRepository,
    private readonly rows: ProphecyRowsService,
  ) {}

  async list(ownerId: string, query: PropheciesQuery): Promise<Paginated<ProphecyListItem>> {
    const today = toIsoDay(new Date());
    const page = Math.max(1, query.page ?? 1);
    const limit = query.limit ?? DEFAULT_PAGE_SIZE;

    const builder = this.prophecies.scoped(ownerId);
    applyFilters(builder, query, today);
    applyOrder(builder, query.sort ?? DEFAULT_PROPHECY_SORT, query.order ?? 'desc');

    // Sin relaciones cargadas: con ellas, `take`/`skip` pasan a una subconsulta
    // con `DISTINCT` y Postgres exige que lo ordenado esté seleccionado
    // (CLAUDE.md). Las cuentas se piden aparte, ya con los ids de la página.
    const [rows, total] = await builder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      items: await this.rows.listItems(rows, today),
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }
}
