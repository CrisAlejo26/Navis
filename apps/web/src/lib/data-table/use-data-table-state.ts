import type { PageSize, TableColumnRef, TableFilter, TableSort } from '@navis/shared';
import { useCallback, useMemo } from 'react';

import { useSession } from '@/lib/auth-client';

import { LOCAL_USER_ID } from './storage-keys';
import { cycleSort } from './table-sorting';
import type { TableColumnSpec, TableRequest } from './types';
import { useTablePreferences, type TablePreferencesApi } from './use-table-preferences';
import { useTableUrl } from './use-table-url';

const NO_SORTS: readonly TableSort[] = [];

export interface DataTableState {
    /** El identificador de la tabla: da nombre a sus preferencias y a las consultas que hace. */
    tableId: string;
    /** Lo que se le pide a la API: URL primero, luego las preferencias, luego lo de fábrica. */
    request: TableRequest;
    preferences: TablePreferencesApi['preferences'];
    updatePreferences: TablePreferencesApi['update'];
    resetPreferences: () => void;
    setPage: (page: number) => void;
    setLimit: (limit: PageSize) => void;
    setSearch: (search: string) => void;
    /** Pulsar una cabecera; con `additive`, suma criterio (Mayús+clic). */
    toggleSort: (columnId: string, additive?: boolean) => void;
    setSorts: (sorts: readonly TableSort[]) => void;
    setFilters: (filters: readonly TableFilter[]) => void;
    /** Pone (o quita, con `null`) el filtro de una columna, sin tocar los de las demás. */
    setColumnFilter: (columnId: string, filter: TableFilter | null) => void;
    clearFilters: () => void;
}

/**
 * El estado de una tabla, con dueño claro (plan de la tabla reutilizable §4 D3):
 * lo que se comparte va en la URL; lo personal, en `localStorage` por usuario.
 *
 * `columns` tiene que ser **estable**. `tableId` también.
 */
export function useDataTableState(
    tableId: string,
    columns: readonly TableColumnSpec[],
    /** El orden de una tabla que aún no se ha ordenado a mano. Una constante, no un literal nuevo por render. */
    defaultSorts: readonly TableSort[] = NO_SORTS,
    /** Una API que solo ordena por una columna lo pide: Mayús+clic deja de sumar criterios. */
    options: { singleSort?: boolean } = {},
): DataTableState {
    const { data: session } = useSession();
    const prefs = useTablePreferences(session?.user.id ?? LOCAL_USER_ID, tableId, columns);
    const refs = useMemo<TableColumnRef[]>(
        () => columns.map(({ id, kind }) => ({ id, kind })),
        [columns],
    );
    const sortable = useMemo(
        () => columns.filter((column) => column.sortable !== false).map((column) => column.id),
        [columns],
    );
    const url = useTableUrl(refs, sortable);

    const { preferences, update, reset } = prefs;
    const { setLimit: setUrlLimit, setSorts: setUrlSorts, setFilters: setUrlFilters } = url;
    const sorts = url.sorts ?? (preferences.sorts.length > 0 ? preferences.sorts : defaultSorts);
    // Los filtros de la URL mandan (un enlace compartido); sin ellos, los de la última vez.
    const filters = url.hasFilters ? url.filters : preferences.filters;

    const request = useMemo<TableRequest>(
        () => ({
            page: url.page,
            limit: url.limit ?? preferences.pageSize,
            search: url.search,
            sorts,
            filters,
        }),
        [url.page, url.limit, url.search, filters, preferences.pageSize, sorts],
    );

    // Elegir un tamaño es una preferencia: se guarda y deja de mandar el de la URL.
    const setLimit = useCallback(
        (limit: PageSize) => {
            update({ pageSize: limit });
            setUrlLimit(undefined);
        },
        [update, setUrlLimit],
    );

    // Orden y filtros se ponen en la URL (para compartirlos) **y** se guardan: la
    // próxima vez que se abra la tabla sin enlace, vuelve como se dejó. Vaciarlos
    // también se guarda, o «quitar filtros» resucitaría los de la última vez.
    const setSorts = useCallback(
        (next: readonly TableSort[]) => {
            setUrlSorts(next);
            update({ sorts: [...next] });
        },
        [setUrlSorts, update],
    );
    const setFilters = useCallback(
        (next: readonly TableFilter[]) => {
            setUrlFilters(next);
            update({ filters: [...next] });
        },
        [setUrlFilters, update],
    );
    const toggleSort = useCallback(
        (columnId: string, additive = false) => {
            setSorts(cycleSort(sorts, columnId, additive && !options.singleSort));
        },
        [sorts, setSorts, options.singleSort],
    );
    const setColumnFilter = useCallback(
        (columnId: string, filter: TableFilter | null) => {
            const others = filters.filter((one) => one.columnId !== columnId);
            setFilters(filter ? [...others, filter] : others);
        },
        [filters, setFilters],
    );
    const clearFilters = useCallback(() => {
        setFilters([]);
    }, [setFilters]);

    return {
        tableId,
        request,
        preferences,
        updatePreferences: update,
        resetPreferences: reset,
        setPage: url.setPage,
        setLimit,
        setSearch: url.setSearch,
        toggleSort,
        setSorts,
        setFilters,
        setColumnFilter,
        clearFilters,
    };
}
