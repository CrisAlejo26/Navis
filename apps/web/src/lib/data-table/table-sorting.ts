import { MAX_TABLE_SORTS, type TableSort } from '@navis/shared';

/**
 * Lo que pasa al pulsar una cabecera: ascendente, descendente y sin orden.
 *
 * Con `additive` (Mayús+clic) la columna se suma a los criterios que ya hay, con
 * su prioridad; sin él, sustituye a todos. Al quitarla queda el orden por
 * defecto de la tabla.
 */
export function cycleSort(
    current: readonly TableSort[],
    columnId: string,
    additive: boolean,
): TableSort[] {
    const existing = current.find((sort) => sort.columnId === columnId);
    const next: TableSort | null =
        existing === undefined
            ? { columnId, dir: 'asc' }
            : existing.dir === 'asc'
              ? { columnId, dir: 'desc' }
              : null;

    if (!additive) return next ? [next] : [];

    const merged = existing
        ? current.flatMap((sort) => (sort.columnId !== columnId ? [sort] : next ? [next] : []))
        : [...current, ...(next ? [next] : [])];
    return merged.slice(0, MAX_TABLE_SORTS);
}

/** Enlaces antiguos: `?sort=name&order=asc`, un solo criterio y sin dos puntos. */
export function legacySort(sort: string | null, order: string | null): string | null {
    if (!sort || sort.includes(':')) return sort;
    return `${sort}:${order === 'asc' ? 'asc' : 'desc'}`;
}
