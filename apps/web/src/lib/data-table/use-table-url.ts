import {
    decodeTableFilters,
    decodeTableSorts,
    encodeTableFilters,
    encodeTableSorts,
    isPageSize,
    type TableColumnRef,
    type TableFilter,
    type TableSort,
} from '@navis/shared';
import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router';

import { legacySort } from './table-sorting';

/** Lo que vive en la URL (se comparte): página, tamaño, búsqueda, orden y filtros. */
export interface TableUrlState {
    page: number;
    /** Solo si la URL lo trae y es un tamaño válido. */
    limit: number | undefined;
    search: string;
    /** `undefined` = la URL no dice nada y manda el orden por defecto. */
    sorts: TableSort[] | undefined;
    filters: TableFilter[];
    /** La URL trae `f`: manda ella, aunque esté vacía. Sin `f`, valen los filtros guardados. */
    hasFilters: boolean;
    setPage: (page: number) => void;
    setLimit: (limit: number | undefined) => void;
    setSearch: (search: string) => void;
    setSorts: (sorts: readonly TableSort[]) => void;
    setFilters: (filters: readonly TableFilter[]) => void;
}

/**
 * Todo cambio de búsqueda, orden o filtros vuelve a la primera página: la 7 de
 * los resultados de antes no existe en los de ahora. Se **reemplaza** la entrada
 * del historial para que teclear no deje diez pasos atrás.
 */
export function useTableUrl(
    columns: readonly TableColumnRef[],
    sortable: readonly string[],
): TableUrlState {
    const [params, setParams] = useSearchParams();

    const update = useCallback(
        (changes: Record<string, string | null>) => {
            setParams(
                (previous) => {
                    const next = new URLSearchParams(previous);
                    for (const [key, value] of Object.entries(changes)) {
                        if (value === null || value === '') next.delete(key);
                        else next.set(key, value);
                    }
                    return next;
                },
                { replace: true },
            );
        },
        [setParams],
    );

    const rawLimit = Number(params.get('limit') ?? 0);
    const rawSort = legacySort(params.get('sort'), params.get('order'));
    const rawFilters = params.get('f');
    const rawSearch = params.get('search') ?? '';
    const rawPage = params.get('page');

    return useMemo(
        () => ({
            page: Math.max(1, Number(rawPage ?? 1) || 1),
            limit: isPageSize(rawLimit) ? rawLimit : undefined,
            search: rawSearch,
            sorts: rawSort ? decodeTableSorts(rawSort, sortable) : undefined,
            filters: decodeTableFilters(rawFilters, columns),
            hasFilters: rawFilters !== null,
            setPage: (page) => {
                update({ page: page > 1 ? String(page) : null });
            },
            setLimit: (limit) => {
                update({ limit: limit ? String(limit) : null, page: null });
            },
            setSearch: (search) => {
                update({ search, page: null });
            },
            // `order` se borra: era la forma antigua y ahora el sentido va en `sort`.
            setSorts: (sorts) => {
                update({ sort: encodeTableSorts(sorts), order: null, page: null });
            },
            setFilters: (filters) => {
                update({ f: encodeTableFilters(filters), page: null });
            },
        }),
        [rawPage, rawLimit, rawSearch, rawSort, rawFilters, columns, sortable, update],
    );
}
