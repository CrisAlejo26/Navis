import {
    isTableFilterValue,
    isTableOperator,
    MAX_TABLE_FILTERS,
    MAX_TABLE_SORTS,
    operatorFitsKind,
    type TableColumnKind,
    type TableFilter,
    type TableSort,
} from './table-state';

/** Lo mínimo que hace falta saber de una columna para validar lo que llega de la URL. */
export interface TableColumnRef {
    id: string;
    kind: TableColumnKind;
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** `nombre:asc,estado:desc`. Sin criterios, cadena vacía: la clave ni se escribe. */
export function encodeTableSorts(sorts: readonly TableSort[]): string {
    return sorts.map((sort) => `${sort.columnId}:${sort.dir}`).join(',');
}

/**
 * Lo que llega de la URL lo escribe cualquiera: una columna que no se puede
 * ordenar, un sentido raro o un criterio repetido se **descartan**, no rompen.
 */
export function decodeTableSorts(
    raw: string | null | undefined,
    sortable: readonly string[],
): TableSort[] {
    if (!raw) return [];
    const result: TableSort[] = [];
    for (const part of raw.split(',')) {
        const [columnId, dir] = part.split(':');
        if (!columnId || (dir !== 'asc' && dir !== 'desc')) continue;
        if (!sortable.includes(columnId) || result.some((sort) => sort.columnId === columnId))
            continue;
        result.push({ columnId, dir });
    }
    return result.slice(0, MAX_TABLE_SORTS);
}

/** JSON legible en DevTools. Sin filtros, cadena vacía. */
export function encodeTableFilters(filters: readonly TableFilter[]): string {
    return filters.length > 0 ? JSON.stringify(filters) : '';
}

/**
 * Deja solo los filtros válidos contra las columnas reales: columna que ya no
 * existe, operador que no le toca a su tipo o valor con otra forma se descartan
 * (mismo criterio que la API con un 400, pero el cliente simplemente lo quita).
 * Sirve igual para lo que llega de la URL que para lo guardado en el navegador.
 */
export function sanitizeTableFilters(
    value: unknown,
    columns: readonly TableColumnRef[],
): TableFilter[] {
    if (!Array.isArray(value)) return [];

    const kinds = new Map(columns.map((column) => [column.id, column.kind]));
    const result: TableFilter[] = [];
    for (const item of (value as unknown[]).slice(0, MAX_TABLE_FILTERS)) {
        if (!isRecord(item) || typeof item.columnId !== 'string') continue;
        const { columnId, operator, value: filterValue } = item;
        const kind = kinds.get(columnId);
        if (!kind || typeof operator !== 'string' || !isTableOperator(operator)) continue;
        if (!operatorFitsKind(operator, kind) || !isTableFilterValue(operator, filterValue))
            continue;
        result.push({ columnId, operator, value: filterValue });
    }
    return result;
}

export function decodeTableFilters(
    raw: string | null | undefined,
    columns: readonly TableColumnRef[],
): TableFilter[] {
    if (!raw) return [];
    try {
        return sanitizeTableFilters(JSON.parse(raw), columns);
    } catch {
        return [];
    }
}
