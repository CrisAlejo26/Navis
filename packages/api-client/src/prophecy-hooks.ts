import type {
  Paginated,
  PropheciesQuery,
  PropheciesStats,
  Prophecy,
  ProphecyListItem,
} from '@navis/shared';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import type { ApiClient } from './client';
import { queryKeys } from './query-keys';

/** `?page=2&state=espera&state=camino`. Lo vacío no viaja. */
export function toSearch(query: PropheciesQuery): string {
  const params = new URLSearchParams();

  if (query.page && query.page > 1) params.set('page', String(query.page));
  if (query.limit) params.set('limit', String(query.limit));
  if (query.search) params.set('search', query.search);
  for (const state of query.state ?? []) params.append('state', state);
  if (query.window && query.window !== 'all') params.set('window', query.window);
  if (query.from) params.set('from', query.from);
  if (query.to) params.set('to', query.to);
  if (query.sort) params.set('sort', query.sort);
  if (query.order) params.set('order', query.order);

  return params.toString();
}

/** Clave estable: el mismo filtro escrito en otro orden comparte caché. */
function keyOf(query: PropheciesQuery): object {
  return { ...query, state: [...(query.state ?? [])].sort().join(',') };
}

/**
 * La página de profecías, con el estado y la espera ya calculados por el
 * servidor (RFC 0004 §6.1).
 *
 * `placeholderData` mantiene la página anterior mientras llega la siguiente:
 * sin él, cambiar de página vacía la lista y da un salto de alto.
 */
export function useProphecies(
  api: ApiClient,
  query: PropheciesQuery,
  enabled = true,
): UseQueryResult<Paginated<ProphecyListItem>> {
  return useQuery({
    queryKey: queryKeys.prophecies.list(keyOf(query)),
    queryFn: () => api.get<Paginated<ProphecyListItem>>(`/prophecies?${toSearch(query)}`),
    enabled,
    staleTime: 30_000,
    placeholderData: (previous) => previous,
  });
}

/**
 * Las cuentas de la portada (§6.2).
 *
 * No se derivan del listado: la página 1 no sabe nada de las otras (D14).
 */
export function usePropheciesStats(
  api: ApiClient,
  enabled = true,
): UseQueryResult<PropheciesStats> {
  return useQuery({
    queryKey: queryKeys.prophecies.stats,
    queryFn: () => api.get<PropheciesStats>('/prophecies/stats'),
    enabled,
    staleTime: 30_000,
  });
}

/** La ficha entera, con el texto completo y sus cumplimientos. */
export function useProphecy(api: ApiClient, id: string, enabled = true): UseQueryResult<Prophecy> {
  return useQuery({
    queryKey: queryKeys.prophecies.one(id),
    queryFn: () => api.get<Prophecy>(`/prophecies/${id}`),
    enabled: enabled && Boolean(id),
    staleTime: 30_000,
  });
}
