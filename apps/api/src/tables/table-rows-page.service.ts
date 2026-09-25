import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
    believerName,
    type CustomTableColumn as CustomTableColumnView,
    type CustomTableRow as CustomTableRowView,
    type Paginated,
} from '@navis/shared';
import { Repository } from 'typeorm';

import { believerFieldOrderExpr, believerSearchExpr } from '../database/believer-field-sql';
import { jsonFieldOrderExpr } from '../database/json-field-sql';
import { CustomTableRow } from './custom-table-row.entity';
import { parseRowFilters } from './parse-row-filters';
import { boundColumnsOf, overlayBoundRow } from './table-believer-overlay';
import { TableBelieversResolver } from './table-believers-resolver.service';
import { toRowView } from './table-row.mapper';
import { applyBelieverRowFilter, applyRowFilter } from './table-row-filters';
import type { CustomTable } from './custom-table.entity';

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
 *
 * Con la tabla enlazada a creyentes (RFC 0025), las columnas vinculadas se
 * resuelven al devolver la página (D11) y sus condiciones —orden, filtro,
 * búsqueda— se traducen contra `believers` con subconsultas correlacionadas
 * (D12): el `FROM` sigue siendo la tabla sola.
 */
@Injectable()
export class TableRowsPageService {
    constructor(
        @InjectRepository(CustomTableRow) private readonly rows: Repository<CustomTableRow>,
        private readonly resolver: TableBelieversResolver,
    ) {}

    async findPage(
        table: CustomTable,
        query: RowsPageQuery,
        activeColumns: readonly CustomTableColumnView[],
    ): Promise<Paginated<CustomTableRowView>> {
        const linked = table.source === 'believers';
        const order = query.order === 'asc' ? 'ASC' : 'DESC';
        const builder = this.rows
            .createQueryBuilder('row')
            .where('row.tableId = :tableId', { tableId: table.id });

        if (query.search) {
            builder.andWhere(
                linked
                    ? `(LOWER(row.data) LIKE LOWER(:search) OR ${believerSearchExpr('search')})`
                    : 'LOWER(row.data) LIKE LOWER(:search)',
                { search: `%${query.search}%` },
            );
        }

        parseRowFilters(query.filters).forEach((filter, index) => {
            const column = activeColumns.find((one) => one.key === filter.columnKey);
            if (linked && column?.believerField) {
                applyBelieverRowFilter(builder, column, filter, index);
            } else {
                applyRowFilter(builder, activeColumns, filter, index);
            }
        });

        if (query.sort) {
            const column = activeColumns.find((one) => one.key === query.sort);
            if (!column) throw new BadRequestException('Esa columna no existe');
            builder.orderBy(
                column.believerField && linked
                    ? believerFieldOrderExpr(column.believerField)
                    : jsonFieldOrderExpr('row.data', column.key, column.type),
                order,
            );
        } else {
            builder.orderBy('row.createdAt', order);
        }
        // Segundo criterio siempre el identificador: sin él, dos filas empatadas
        // bailan de página en página entre una consulta y la siguiente.
        builder.addOrderBy('row.id', 'ASC');

        builder.offset((query.page - 1) * query.limit).limit(query.limit);

        const [items, total] = await builder.getManyAndCount();
        const views = items.map((row) => toRowView(row, activeColumns));

        if (linked) {
            const resolved = await this.resolver.resolve(items, table.churchId);
            const vinculadas = boundColumnsOf(activeColumns);

            views.forEach((view, index) => {
                const one = resolved[index] ?? null;
                view.believer = one && {
                    id: one.believer.id,
                    name: believerName(one.believer),
                    photoKey: one.believer.photoKey,
                };
                overlayBoundRow(
                    view,
                    vinculadas,
                    one?.believer ?? null,
                    one?.congregationName ?? null,
                );
            });
        }

        return {
            items: views,
            total,
            page: query.page,
            limit: query.limit,
            totalPages: Math.max(1, Math.ceil(total / query.limit)),
        };
    }
}
