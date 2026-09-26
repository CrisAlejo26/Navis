import type {
    CustomTableColumn,
    RowFilter,
    TableColumnType,
    TableFilter,
    TableSort,
} from '@navis/shared';

import type { CellValue } from '@/lib/data-table/columns';
import type { TableColumnSpec, TableRequest } from '@/lib/data-table/types';
import { NUMERIC_TYPES, TEXT_TYPES } from '@/lib/tables/column-types';

/**
 * Lo que la tabla de datos necesita saber de una columna **personalizada**: su
 * tipo, qué filtros admite y si se puede ordenar. Es el mismo reparto que hace la
 * API en `table-row-filters.ts` (RFC 0021 D30): texto «contiene», números y
 * fechas «entre», casilla «es», selección «es uno de». La contraseña no se
 * filtra ni se ordena (D29).
 */
export function columnSpec(column: CustomTableColumn): TableColumnSpec {
    const type: TableColumnType = column.type;
    const base = { id: column.key, sortable: true, filterable: true } as const;

    if (type === 'password') return { ...base, kind: 'text', sortable: false, filterable: false };
    if (TEXT_TYPES.has(type)) return { ...base, kind: 'text', operators: ['contains'] };
    if (NUMERIC_TYPES.has(type)) return { ...base, kind: 'number', operators: ['between'] };
    if (type === 'date') return { ...base, kind: 'date', operators: ['between'] };
    if (type === 'checkbox') return { ...base, kind: 'boolean', operators: ['is'] };
    return { ...base, kind: 'select', operators: ['in'], facet: true };
}

/** El valor en bruto de una celda, para el orden y el buscador en modo cliente. */
export function cellValueOf(value: unknown): CellValue {
    return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean'
        ? value
        : null;
}

const OPERATOR_OF: Partial<Record<TableFilter['operator'], RowFilter['operator']>> = {
    contains: 'contains',
    between: 'between',
    is: 'equals',
    in: 'in',
};

/** De los filtros de la tabla a los de la API de filas: el mismo dato con otro nombre. */
export function toRowFilters(filters: readonly TableFilter[]): RowFilter[] {
    return filters.flatMap((filter) => {
        const operator = OPERATOR_OF[filter.operator];
        return operator ? [{ columnKey: filter.columnId, operator, value: filter.value }] : [];
    });
}

/** Lo que acepta `GET /tables/:id/rows`: **una** columna de orden, o la más reciente primero. */
export function toRowsQuery(
    request: TableRequest,
    columns: readonly CustomTableColumn[],
): {
    page: number;
    limit: number;
    search: string | undefined;
    sort: string | undefined;
    order: TableSort['dir'];
    filters: string | undefined;
} {
    const first = request.sorts[0];
    const sortable = columns.find((one) => one.key === first?.columnId && one.type !== 'password');
    const filters = toRowFilters(request.filters);

    return {
        page: request.page,
        limit: request.limit,
        search: request.search || undefined,
        sort: sortable?.key,
        order: sortable ? (first?.dir ?? 'desc') : 'desc',
        filters: filters.length > 0 ? JSON.stringify(filters) : undefined,
    };
}
