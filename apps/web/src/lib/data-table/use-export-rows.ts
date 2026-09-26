import { useQuery } from '@tanstack/react-query';
import type { RowData as TableRowData } from '@tanstack/react-table';

import type { TableExportConfig } from './export-config';
import { sourceItems, type DataTableSource } from './source';
import type { TableRequest } from './types';
import type { DataTableInstance } from './use-data-table';
import type { RowSelection } from './use-row-selection';

export type ExportScope = 'all' | 'selection';

export interface ExportRows<TItem> {
    items: readonly TItem[];
    total: number;
    truncated: boolean;
    isLoading: boolean;
}

/**
 * Qué filas se llevan al exportar, **sin salir de la tabla**:
 *
 * - **La selección**: las marcadas, con el dato entero, aunque estén en otra página.
 * - **Todo, en modo cliente**: lo filtrado y ordenado, sin paginar.
 * - **Todo, en modo servidor**: la página que se ve, avisando de que es una parte.
 *   Si la pantalla trae `fetchAll`, lo sustituye `useRemoteExportRows`.
 */
export function useExportRows<TItem extends TableRowData>(options: {
    scope: ExportScope | null;
    table: DataTableInstance<TItem>;
    source: DataTableSource<TItem>;
    selection: RowSelection<TItem>;
}): ExportRows<TItem> {
    const { scope, table, source, selection } = options;

    if (scope === 'selection') {
        return {
            items: selection.items,
            total: selection.count,
            truncated: false,
            isLoading: false,
        };
    }
    if (source.kind === 'client') {
        const items = table.getPrePaginatedRowModel().rows.map((row) => row.original);
        return { items, total: items.length, truncated: false, isLoading: false };
    }

    const items = sourceItems(source) ?? [];
    const total = source.page?.total ?? items.length;
    return { items, total, truncated: total > items.length, isLoading: false };
}

/**
 * Todas las filas que cumplen los filtros, pedidas al servidor con `fetchAll`.
 * Vive aparte porque necesita React Query, y solo se monta cuando el diálogo de
 * exportar está abierto: una tabla que no exporta no debería pedirlo.
 */
export function useRemoteExportRows<TItem>(options: {
    config: TableExportConfig<TItem>;
    request: TableRequest;
    tableId: string;
    enabled: boolean;
}): ExportRows<TItem> | null {
    const { config, request, tableId, enabled } = options;
    const fetchAll = config.fetchAll;
    const active = enabled && fetchAll !== undefined;

    const query = useQuery({
        // Sin `page`: la petición trae todo, y cambiar de página no debe repetirla.
        queryKey: ['data-table-export', tableId, { ...request, page: 0 }],
        queryFn: ({ signal }) =>
            fetchAll ? fetchAll(request, signal) : Promise.reject(new Error('sin fetchAll')),
        enabled: active,
        staleTime: 0,
    });

    if (!active) return null;
    return {
        items: query.data?.items ?? [],
        total: query.data?.total ?? 0,
        truncated: query.data?.truncated ?? false,
        isLoading: query.isPending,
    };
}
