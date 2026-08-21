import type {
  Paginated,
  Teaching,
  TeachingListItem,
  TeachingsQuery,
  TeachingsStats,
} from '@navis/shared';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import type { ApiClient } from './client';
import { queryKeys } from './query-keys';

/** `?page=2&search=paciencia`. Lo vacío no viaja. */
export function toTeachingSearch(query: TeachingsQuery): string {
  const params = new URLSearchParams();

  if (query.page && query.page > 1) params.set('page', String(query.page));
  if (query.limit) params.set('limit', String(query.limit));
  if (query.search) params.set('search', query.search);
  if (query.sort) params.set('sort', query.sort);
  if (query.order) params.set('order', query.order);

  return params.toString();
}

export function useTeachings(
  api: ApiClient,
  query: TeachingsQuery,
  enabled = true,
): UseQueryResult<Paginated<TeachingListItem>> {
  return useQuery({
    queryKey: queryKeys.teachings.list(query),
    queryFn: () => api.get<Paginated<TeachingListItem>>(`/teachings?${toTeachingSearch(query)}`),
    enabled,
    staleTime: 30_000,
    placeholderData: (previous) => previous,
  });
}

/** Las cuentas de la portada. No se derivan del listado: la página 1 no sabe de las otras. */
export function useTeachingsStats(api: ApiClient, enabled = true): UseQueryResult<TeachingsStats> {
  return useQuery({
    queryKey: queryKeys.teachings.stats,
    queryFn: () => api.get<TeachingsStats>('/teachings/stats'),
    enabled,
    staleTime: 30_000,
  });
}

export function useTeaching(api: ApiClient, id: string, enabled = true): UseQueryResult<Teaching> {
  return useQuery({
    queryKey: queryKeys.teachings.one(id),
    queryFn: () => api.get<Teaching>(`/teachings/${id}`),
    enabled: enabled && Boolean(id),
    staleTime: 30_000,
  });
}
