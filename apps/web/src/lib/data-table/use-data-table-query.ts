import type { Paginated } from '@navis/shared';
import {
    keepPreviousData,
    useQuery,
    useQueryClient,
    type UseQueryResult,
} from '@tanstack/react-query';
import { useEffect } from 'react';

import type { TableRequest } from './types';

const PREFETCH_STALE_MS = 30_000;

/**
 * Pide la página que dice el estado de la tabla.
 *
 * - **Conserva la página anterior** mientras llega la nueva (`keepPreviousData`):
 *   sin eso la tabla parpadea a esqueleto en cada clic de paginación.
 * - **Precarga la siguiente**, que es la que casi siempre se pide después.
 * - La clave lleva la petición entera: cada combinación se cachea por separado y
 *   una respuesta lenta de la anterior nunca pisa a la actual.
 *
 * `queryKey` es la raíz de la pantalla (p. ej. `queryKeys.believers.all`), para
 * que invalidarla desde cualquier sitio siga alcanzando a la tabla. `fetchPage`
 * tiene que ser estable (`useCallback`).
 */
export function useDataTableQuery<TItem>(options: {
    queryKey: readonly unknown[];
    request: TableRequest;
    fetchPage: (request: TableRequest, signal: AbortSignal) => Promise<Paginated<TItem>>;
    enabled?: boolean;
}): UseQueryResult<Paginated<TItem>> {
    const { queryKey, request, fetchPage, enabled = true } = options;
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: [...queryKey, 'table', request],
        queryFn: ({ signal }) => fetchPage(request, signal),
        placeholderData: keepPreviousData,
        enabled,
    });

    const totalPages = query.data?.totalPages ?? 0;
    // Con la página anterior aún en pantalla (`isPlaceholderData`), sus datos no son
    // los de esta petición: precargar «la siguiente» partiría de un total ajeno.
    const settled = query.isSuccess && !query.isPlaceholderData;
    useEffect(() => {
        if (!enabled || !settled || request.page >= totalPages) return;
        const next = { ...request, page: request.page + 1 };
        void queryClient.prefetchQuery({
            queryKey: [...queryKey, 'table', next],
            queryFn: ({ signal }) => fetchPage(next, signal),
            // Sin esto, cada render volvería a pedir la página de al lado.
            staleTime: PREFETCH_STALE_MS,
        });
    }, [enabled, settled, request, totalPages, queryKey, fetchPage, queryClient]);

    return query;
}
