import type {
  Dream,
  DreamListItem,
  DreamsQuery,
  DreamsStats,
  EmotionWithCount,
  Paginated,
} from '@navis/shared';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import type { ApiClient } from './client';
import { queryKeys } from './query-keys';

/**
 * `?page=2&state=apuntado&emotion=…`. Lo vacío no viaja.
 *
 * Se llama `toDreamSearch` y no `toSearch` porque el paquete reexporta todo en
 * plano y profecías ya tiene el suyo: dos `toSearch` en el mismo `index` se
 * pisan sin avisar.
 */
export function toDreamSearch(query: DreamsQuery): string {
  const params = new URLSearchParams();

  if (query.page && query.page > 1) params.set('page', String(query.page));
  if (query.limit) params.set('limit', String(query.limit));
  if (query.search) params.set('search', query.search);
  for (const state of query.state ?? []) params.append('state', state);
  for (const emotion of query.emotion ?? []) params.append('emotion', emotion);
  if (query.from) params.set('from', query.from);
  if (query.to) params.set('to', query.to);
  if (query.year) params.set('year', String(query.year));
  if (query.sort) params.set('sort', query.sort);
  if (query.order) params.set('order', query.order);

  return params.toString();
}

/** Clave estable: el mismo filtro escrito en otro orden comparte caché. */
function keyOf(query: DreamsQuery): object {
  return {
    ...query,
    state: [...(query.state ?? [])].sort().join(','),
    emotion: [...(query.emotion ?? [])].sort().join(','),
  };
}

/**
 * La página de sueños, con el estado ya calculado por el servidor (§6.1).
 *
 * `placeholderData` mantiene la página anterior mientras llega la siguiente:
 * sin él, cambiar de página vacía la lista y da un salto de alto.
 */
export function useDreams(
  api: ApiClient,
  query: DreamsQuery,
  enabled = true,
): UseQueryResult<Paginated<DreamListItem>> {
  return useQuery({
    queryKey: queryKeys.dreams.list(keyOf(query)),
    queryFn: () => api.get<Paginated<DreamListItem>>(`/dreams?${toDreamSearch(query)}`),
    enabled,
    staleTime: 30_000,
    placeholderData: (previous) => previous,
  });
}

/**
 * Las cuentas de la portada (§6.2).
 *
 * No se derivan del listado: la página 1 no sabe nada de las otras (D15).
 */
export function useDreamsStats(api: ApiClient, enabled = true): UseQueryResult<DreamsStats> {
  return useQuery({
    queryKey: queryKeys.dreams.stats,
    queryFn: () => api.get<DreamsStats>('/dreams/stats'),
    enabled,
    staleTime: 30_000,
  });
}

/** La ficha entera, con el texto completo, sus emociones y sus audios. */
export function useDream(api: ApiClient, id: string, enabled = true): UseQueryResult<Dream> {
  return useQuery({
    queryKey: queryKeys.dreams.one(id),
    queryFn: () => api.get<Dream>(`/dreams/${id}`),
    enabled: enabled && Boolean(id),
    staleTime: 30_000,
  });
}

/**
 * El vocabulario: las doce de serie y las propias, con cuántas veces aparecen.
 *
 * Se queda fresco más rato que lo demás porque cambia poco: se toca al crear
 * una emoción, y eso ya invalida.
 */
export function useEmotions(api: ApiClient, enabled = true): UseQueryResult<EmotionWithCount[]> {
  return useQuery({
    queryKey: queryKeys.dreams.emotions,
    queryFn: () => api.get<EmotionWithCount[]>('/dreams/emotions'),
    enabled,
    staleTime: 300_000,
  });
}
