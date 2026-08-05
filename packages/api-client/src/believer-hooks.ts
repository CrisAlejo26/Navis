import type { BelieverListItem, BelieversQuery, BelieversSummary, Paginated } from '@navis/shared';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import type { ApiClient } from './client';
import { queryKeys } from './query-keys';

/**
 * `?page=2&status=activo&status=nuevo`. Lo vacío no viaja.
 *
 * Se llama `toBelieverSearch` y no `toSearch` porque el paquete reexporta todo
 * en plano y profecías ya tiene el suyo: dos `toSearch` en el mismo `index` se
 * pisan sin avisar (CLAUDE.md).
 */
export function toBelieverSearch(query: BelieversQuery): string {
  const params = new URLSearchParams();

  if (query.page && query.page > 1) params.set('page', String(query.page));
  if (query.limit) params.set('limit', String(query.limit));
  if (query.search) params.set('search', query.search);
  for (const status of query.status ?? []) params.append('status', status);
  if (query.congregationId) params.set('congregationId', query.congregationId);
  if (query.giftId) params.set('giftId', query.giftId);
  if (query.attention) params.set('attention', 'true');
  if (query.sort) params.set('sort', query.sort);
  if (query.order) params.set('order', query.order);

  return params.toString();
}

/** Clave estable: el mismo filtro escrito en otro orden comparte caché. */
function keyOf(query: BelieversQuery): object {
  return { ...query, status: [...(query.status ?? [])].sort().join(',') };
}

/**
 * La página de creyentes, con la sonda de cada uno ya calculada por el
 * servidor (RFC 0003 §6.1).
 *
 * `placeholderData` mantiene la página anterior mientras llega la siguiente:
 * sin él, cambiar de página vacía la tabla y da un salto de alto.
 */
export function useBelievers(
  api: ApiClient,
  query: BelieversQuery,
  enabled = true,
): UseQueryResult<Paginated<BelieverListItem>> {
  return useQuery({
    queryKey: queryKeys.believers.list(keyOf(query)),
    queryFn: () => api.get<Paginated<BelieverListItem>>(`/believers?${toBelieverSearch(query)}`),
    enabled,
    staleTime: 30_000,
    placeholderData: (previous) => previous,
  });
}

/** Las cuentas de la cabecera: viven en las pastillas, no en un panel (§7.1). */
export function useBelieversSummary(
  api: ApiClient,
  enabled = true,
): UseQueryResult<BelieversSummary> {
  return useQuery({
    queryKey: queryKeys.believers.summary,
    queryFn: () => api.get<BelieversSummary>('/believers/summary'),
    enabled,
    staleTime: 30_000,
  });
}

/** La ficha entera, que es lo que abre `/believers/:id` (D12). */
export function useBeliever(
  api: ApiClient,
  id: string,
  enabled = true,
): UseQueryResult<BelieverListItem> {
  return useQuery({
    queryKey: queryKeys.believers.one(id),
    queryFn: () => api.get<BelieverListItem>(`/believers/${id}`),
    enabled: enabled && Boolean(id),
    staleTime: 30_000,
  });
}
