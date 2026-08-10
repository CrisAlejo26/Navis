import type { MessagesPage } from '@navis/shared';
import { useInfiniteQuery, type UseInfiniteQueryResult } from '@tanstack/react-query';

import type { ApiClient } from './client';
import { queryKeys } from './query-keys';

/** La ruta de una página del historial. Sin `before`, la primera (los últimos mensajes). */
export function messagesPath(channelId: string, before?: string): string {
  const params = new URLSearchParams();
  if (before) params.set('before', before);
  const qs = params.toString();

  return `/channels/${channelId}/messages${qs ? `?${qs}` : ''}`;
}

/**
 * El cursor de la página siguiente: el `createdAt` del mensaje más viejo ya
 * cargado en esta página, o nada si el servidor dice que no queda más atrás.
 */
export function nextMessagesCursor(page: MessagesPage): string | undefined {
  return page.hasMore ? page.items[0]?.createdAt : undefined;
}

/**
 * El historial de un canal, paginado por cursor (`before`), no por página
 * (RFC 0016 §3): cada página trae sus mensajes de más viejo a más nuevo, y
 * `hasMore` dice si queda algo más atrás.
 *
 * La primera página no lleva `before` — trae los últimos mensajes—, y cada
 * `fetchNextPage` pide los anteriores al más viejo ya cargado. El botón «Ver
 * mensajes anteriores» (D11, como `useBelieverNotes`) es quien decide cuándo
 * llamarla, no un `IntersectionObserver`.
 */
export function useMessages(
  api: ApiClient,
  channelId: string,
  enabled = true,
  pollMs?: number,
): UseInfiniteQueryResult<{ pages: MessagesPage[] }> {
  return useInfiniteQuery({
    queryKey: queryKeys.chat.messages(channelId),
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) => api.get<MessagesPage>(messagesPath(channelId, pageParam)),
    getNextPageParam: nextMessagesCursor,
    enabled: enabled && Boolean(channelId),
    staleTime: 5_000,
    refetchInterval: pollMs,
  });
}
