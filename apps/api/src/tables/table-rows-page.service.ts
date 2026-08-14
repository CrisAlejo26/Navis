import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  type CustomTableColumn as CustomTableColumnView,
  type CustomTableRow as CustomTableRowView,
  type Paginated,
} from '@navis/shared';
import { Repository } from 'typeorm';

import { jsonFieldOrderExpr } from '../database/json-field-sql';
import { CustomTableRow } from './custom-table-row.entity';
import { parseRowFilters } from './parse-row-filters';
import { toRowView } from './table-row.mapper';
import { applyRowFilter } from './table-row-filters';

export interface RowsPageQuery {
  page: number;
  limit: number;
  order: 'asc' | 'desc';
  sort?: string;
  search?: string;
  filters?: string;
}

/**
 * La página de filas de una tabla, con búsqueda, orden y filtros (RFC 0021
 * D14–D19, D28–D30).
 *
 * Sin relaciones cargadas en la consulta: el valor de cada celda ya está en
 * la propia fila, así que la trampa de `take`/`skip` con `DISTINCT` en
 * Postgres (CLAUDE.md) no llega a plantearse aquí.
 */
@Injectable()
export class TableRowsPageService {
  constructor(
    @InjectRepository(CustomTableRow) private readonly rows: Repository<CustomTableRow>,
  ) {}

  async findPage(
    tableId: string,
    query: RowsPageQuery,
    activeColumns: readonly CustomTableColumnView[],
  ): Promise<Paginated<CustomTableRowView>> {
    const order = query.order === 'asc' ? 'ASC' : 'DESC';
    const builder = this.rows
      .createQueryBuilder('row')
      .where('row.tableId = :tableId', { tableId });

    if (query.search) {
      builder.andWhere('LOWER(row.data) LIKE LOWER(:search)', { search: `%${query.search}%` });
    }

    parseRowFilters(query.filters).forEach((filter, index) => {
      applyRowFilter(builder, activeColumns, filter, index);
    });

    if (query.sort) {
      const column = activeColumns.find((one) => one.key === query.sort);
      if (!column) throw new BadRequestException('Esa columna no existe');
      builder.orderBy(jsonFieldOrderExpr('row.data', column.key, column.type), order);
    } else {
      builder.orderBy('row.createdAt', order);
    }
    // Segundo criterio siempre el identificador: sin él, dos filas empatadas
    // bailan de página en página entre una consulta y la siguiente.
    builder.addOrderBy('row.id', 'ASC');

    builder.offset((query.page - 1) * query.limit).limit(query.limit);

    const [items, total] = await builder.getManyAndCount();

    return {
      items: items.map((row) => toRowView(row, activeColumns)),
      total,
      page: query.page,
      limit: query.limit,
      totalPages: Math.max(1, Math.ceil(total / query.limit)),
    };
  }
}
