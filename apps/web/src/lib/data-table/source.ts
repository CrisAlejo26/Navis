import type { Paginated } from '@navis/shared';
import type { UseQueryResult } from '@tanstack/react-query';

interface SourceStatus {
    isLoading: boolean;
    isError: boolean;
    onRetry?: () => void;
}

/**
 * De dónde salen las filas. **Servidor**: llega una página ya filtrada, ordenada
 * y contada por la API. **Cliente**: llega la lista entera y la tabla hace todo
 * (para listas cortas ya cargadas, como los roles).
 */
export type DataTableSource<TItem> =
    | (SourceStatus & {
          kind: 'server';
          page: Paginated<TItem> | undefined;
          /** Hay una petición en vuelo (cambio de página, de orden…). */
          isFetching: boolean;
      })
    | (SourceStatus & { kind: 'client'; items: TItem[] | undefined });

export function serverSource<TItem>(
    query: UseQueryResult<Paginated<TItem>>,
): DataTableSource<TItem> {
    return {
        kind: 'server',
        page: query.data,
        isLoading: query.isPending,
        isFetching: query.isFetching,
        isError: query.isError,
        onRetry: () => {
            void query.refetch();
        },
    };
}

export function sourceItems<TItem>(source: DataTableSource<TItem>): TItem[] | undefined {
    return source.kind === 'server' ? source.page?.items : source.items;
}
