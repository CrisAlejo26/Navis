import type {
  JournalEntry,
  JournalEntryListItem,
  JournalQuery,
  JournalStats,
  Paginated,
} from '@navis/shared';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import type { ApiClient } from './client';
import { queryKeys } from './query-keys';

/**
 * `?page=2&kind=oracion&kind=decision`. Lo vacío no viaja.
 *
 * Se llama `toJournalSearch` y no `toSearch`: el paquete reexporta todo en
 * plano y profecías ya tiene el suyo (mismo motivo que `toDreamSearch`).
 */
export function toJournalSearch(query: JournalQuery): string {
  const params = new URLSearchParams();

  if (query.page && query.page > 1) params.set('page', String(query.page));
  if (query.limit) params.set('limit', String(query.limit));
  if (query.search) params.set('search', query.search);
  for (const kind of query.kind ?? []) params.append('kind', kind);
  if (query.window && query.window !== 'all') params.set('window', query.window);
  if (query.from) params.set('from', query.from);
  if (query.to) params.set('to', query.to);
  if (query.pendingReminder) params.set('pendingReminder', 'true');
  if (query.sort) params.set('sort', query.sort);
  if (query.order) params.set('order', query.order);

  return params.toString();
}

/** Clave estable: el mismo filtro escrito en otro orden comparte caché. */
function keyOf(query: JournalQuery): object {
  return { ...query, kind: [...(query.kind ?? [])].sort().join(',') };
}

/**
 * El listado del cuaderno, con el extracto y las cuentas ya resueltos por el
 * servidor (§6.1).
 *
 * `placeholderData` mantiene la página anterior mientras llega la siguiente:
 * sin él, cambiar de página vacía la lista y da un salto de alto.
 */
export function useJournal(
  api: ApiClient,
  query: JournalQuery,
  enabled = true,
): UseQueryResult<Paginated<JournalEntryListItem>> {
  return useQuery({
    queryKey: queryKeys.journal.list(keyOf(query)),
    queryFn: () => api.get<Paginated<JournalEntryListItem>>(`/journal?${toJournalSearch(query)}`),
    enabled,
    staleTime: 30_000,
    placeholderData: (previous) => previous,
  });
}

/**
 * Las cuentas de la portada (§6.2).
 *
 * No se derivan del listado: la página 1 no sabe nada de las otras (D11).
 */
export function useJournalStats(api: ApiClient, enabled = true): UseQueryResult<JournalStats> {
  return useQuery({
    queryKey: queryKeys.journal.stats,
    queryFn: () => api.get<JournalStats>('/journal/stats'),
    enabled,
    staleTime: 30_000,
  });
}

/** La ficha entera, con el texto completo y sus audios. */
export function useJournalEntry(
  api: ApiClient,
  id: string,
  enabled = true,
): UseQueryResult<JournalEntry> {
  return useQuery({
    queryKey: queryKeys.journal.one(id),
    queryFn: () => api.get<JournalEntry>(`/journal/${id}`),
    enabled: enabled && Boolean(id),
    staleTime: 30_000,
  });
}
