import {
    functionalUpdate,
    useTable,
    type ColumnOrderState,
    type ColumnVisibilityState,
    type OnChangeFn,
    type RowData as TableRowData,
    type SortingState,
} from '@tanstack/react-table';
import { useMemo } from 'react';

import { applyClientFilters, applyClientSearch } from './filter-match';

import { toColumnDefs, type DataTableColumn } from './columns';
import { sourceItems, type DataTableSource } from './source';
import { dataTableFeatures } from './table-features';
import type { DataTableState } from './use-data-table-state';

const NO_ITEMS: never[] = [];

/**
 * Une el estado de Navis (URL + preferencias) con TanStack Table.
 *
 * TanStack no es dueño de nada: filtros, orden y página los manda `state`, y
 * en modo servidor los tres `manual*` le dicen que no los recalcule. Lo que sí
 * hace él es lo suyo: el modelo de columnas (visibles y en su orden), las filas
 * y `FlexRender`.
 */
export function useDataTable<TItem extends TableRowData>(options: {
    columns: readonly DataTableColumn<TItem>[];
    source: DataTableSource<TItem>;
    state: DataTableState;
    getKey: (item: TItem) => string;
}) {
    const { columns, source, state, getKey } = options;
    const { request, preferences, updatePreferences } = state;
    const isServer = source.kind === 'server';

    const defs = useMemo(() => toColumnDefs(columns), [columns]);
    const items = sourceItems(source);
    // En modo cliente filtros y búsqueda los aplica la tabla; en servidor ya vienen aplicados.
    const filtered = useMemo(
        () =>
            !isServer && items
                ? applyClientSearch(
                      applyClientFilters(items, columns, request.filters),
                      columns,
                      request.search,
                  )
                : items,
        [isServer, items, columns, request.filters, request.search],
    );
    const sorting = useMemo<SortingState>(
        () => request.sorts.map((sort) => ({ id: sort.columnId, desc: sort.dir === 'desc' })),
        [request.sorts],
    );

    const onColumnVisibilityChange: OnChangeFn<ColumnVisibilityState> = (updater) => {
        updatePreferences({
            columnVisibility: functionalUpdate(updater, preferences.columnVisibility),
        });
    };
    const onColumnOrderChange: OnChangeFn<ColumnOrderState> = (updater) => {
        updatePreferences({ columnOrder: functionalUpdate(updater, preferences.columnOrder) });
    };

    return useTable({
        features: dataTableFeatures,
        columns: defs,
        data: filtered ?? NO_ITEMS,
        getRowId: getKey,
        manualSorting: isServer,
        manualPagination: isServer,
        manualFiltering: isServer,
        rowCount: source.kind === 'server' ? source.page?.total : undefined,
        state: {
            sorting,
            pagination: { pageIndex: request.page - 1, pageSize: request.limit },
            columnVisibility: preferences.columnVisibility,
            columnOrder: preferences.columnOrder,
        },
        onColumnVisibilityChange,
        onColumnOrderChange,
    });
}

/** El tipo de lo que devuelve `useDataTable`, para pasarlo a las piezas de la tabla. */
export type DataTableInstance<TItem extends TableRowData> = ReturnType<typeof useDataTable<TItem>>;
