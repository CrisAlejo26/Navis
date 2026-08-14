import type {
  CustomTable,
  CustomTableRow,
  CustomTableRowsQuery,
  CustomTableView,
  CustomTableWithColumns,
  Paginated,
} from '@navis/shared';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import type { ApiClient } from './client';
import { queryKeys } from './query-keys';

/** `?page=&limit=&sort=&order=&search=&filters=`. Lo vacío no viaja. */
export function toTableRowsSearch(query: CustomTableRowsQuery): string {
  const params = new URLSearchParams();

  if (query.page > 1) params.set('page', String(query.page));
  if (query.limit) params.set('limit', String(query.limit));
  if (query.sort) params.set('sort', query.sort);
  if (query.order) params.set('order', query.order);
  if (query.search) params.set('search', query.search);
  if (query.filters) params.set('filters', query.filters);

  return params.toString();
}

/** Las tablas de la iglesia (RFC 0021), para el tablón y las subentradas. */
export function useTables(api: ApiClient, enabled = true): UseQueryResult<CustomTable[]> {
  return useQuery({
    queryKey: queryKeys.tables.all,
    queryFn: () => api.get<CustomTable[]>('/tables'),
    enabled,
    staleTime: 15_000,
  });
}

/** La ficha, con sus columnas activas. */
export function useTable(
  api: ApiClient,
  id: string,
  enabled = true,
): UseQueryResult<CustomTableWithColumns> {
  return useQuery({
    queryKey: queryKeys.tables.one(id),
    queryFn: () => api.get<CustomTableWithColumns>(`/tables/${id}`),
    enabled: enabled && Boolean(id),
    staleTime: 15_000,
  });
}

/** Una página de filas, con búsqueda, orden y filtros ya resueltos (D30). */
export function useTableRows(
  api: ApiClient,
  tableId: string,
  query: CustomTableRowsQuery,
  enabled = true,
): UseQueryResult<Paginated<CustomTableRow>> {
  const search = toTableRowsSearch(query);

  return useQuery({
    queryKey: queryKeys.tables.rows(tableId, { search }),
    queryFn: () => api.get<Paginated<CustomTableRow>>(`/tables/${tableId}/rows?${search}`),
    enabled: enabled && Boolean(tableId),
    staleTime: 10_000,
    placeholderData: (previous) => previous,
  });
}

/** Las vistas guardadas de la tabla (D24). */
export function useTableViews(
  api: ApiClient,
  tableId: string,
  enabled = true,
): UseQueryResult<CustomTableView[]> {
  return useQuery({
    queryKey: queryKeys.tables.views(tableId),
    queryFn: () => api.get<CustomTableView[]>(`/tables/${tableId}/views`),
    enabled: enabled && Boolean(tableId),
    staleTime: 30_000,
  });
}
