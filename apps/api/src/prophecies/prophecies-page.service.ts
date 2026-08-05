import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  DEFAULT_PAGE_SIZE,
  DEFAULT_PROPHECY_SORT,
  type Paginated,
  type PropheciesQuery,
  type ProphecyListItem,
} from '@navis/shared';
import { In, Repository } from 'typeorm';

import { toIsoDay } from '../database/iso-day';
import { PropheciesRepository } from './prophecies.repository';
import { applyFilters, applyOrder } from './prophecies-filter';
import { toListItem } from './prophecies.mapper';
import { ProphecyFulfillment } from './prophecy-fulfillment.entity';

/** El listado paginado, con sus filtros y su orden (RFC 0004 §6.1). */
@Injectable()
export class PropheciesPageService {
  constructor(
    private readonly prophecies: PropheciesRepository,
    @InjectRepository(ProphecyFulfillment)
    private readonly fulfillments: Repository<ProphecyFulfillment>,
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

    const days = await this.fulfillmentDays(rows.map((one) => one.id));

    return {
      items: rows.map((row) => toListItem(row, today, days.get(row.id) ?? [])),
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  /**
   * Los días de cada cumplimiento, agrupados por profecía y de una sola
   * consulta, ya con los identificadores de la página.
   *
   * Se traen las fechas y no un `COUNT` porque son las **marcas de la
   * travesía** (§7.5), y de paso el número sale de contarlas.
   */
  private async fulfillmentDays(ids: readonly string[]): Promise<Map<string, string[]>> {
    // Un `IN ('')` contra una columna `uuid` revienta en Postgres (CLAUDE.md):
    // los identificadores vacíos se filtran antes de la consulta.
    const unique = [...new Set(ids)].filter(Boolean);
    if (unique.length === 0) return new Map();

    const rows = await this.fulfillments.find({
      where: { prophecyId: In(unique) },
      select: { prophecyId: true, occurredAt: true },
      order: { occurredAt: 'ASC' },
    });

    const grouped = new Map<string, string[]>();
    for (const row of rows) {
      const days = grouped.get(row.prophecyId) ?? [];
      days.push(toIsoDay(row.occurredAt));
      grouped.set(row.prophecyId, days);
    }

    return grouped;
  }
}
