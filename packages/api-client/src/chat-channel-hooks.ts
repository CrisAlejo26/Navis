import type { ChannelDetail, ChannelListItem, ChannelsQuery, ChatContact } from '@navis/shared';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import type { ApiClient } from './client';
import { queryKeys } from './query-keys';

/**
 * La bandeja de Comunicaciones: los canales de esta cuenta, con el no leídos
 * ya calculado. `pollMs` es el sondeo de respaldo del RFC 0016 §8: quien
 * llama lo pone a 30 000 solo cuando el socket está caído.
 */
export function useChannels(
  api: ApiClient,
  query: ChannelsQuery = {},
  enabled = true,
  pollMs?: number,
): UseQueryResult<ChannelListItem[]> {
  return useQuery({
    queryKey: queryKeys.chat.channels(query),
    queryFn: () => api.get<ChannelListItem[]>(`/channels${query.archived ? '?archived=true' : ''}`),
    enabled,
    staleTime: 10_000,
    refetchInterval: pollMs,
  });
}

/** Un total de no leídos, para el globo del icono de navegación (§13). */
export function useUnreadTotal(api: ApiClient, enabled = true): number {
  const { data } = useChannels(api, {}, enabled);
  return data?.reduce((total, channel) => total + channel.unreadCount, 0) ?? 0;
}

export function useChannel(
  api: ApiClient,
  id: string,
  enabled = true,
): UseQueryResult<ChannelDetail> {
  return useQuery({
    queryKey: queryKeys.chat.channel(id),
    queryFn: () => api.get<ChannelDetail>(`/channels/${id}`),
    enabled: enabled && Boolean(id),
    staleTime: 10_000,
  });
}

/** Cuentas de la iglesia con las que se puede hablar (§2): el picker de contactos. */
export function useChatContacts(
  api: ApiClient,
  search = '',
  enabled = true,
): UseQueryResult<ChatContact[]> {
  return useQuery({
    queryKey: queryKeys.chat.contacts(search),
    queryFn: () =>
      api.get<ChatContact[]>(
        `/channels/contacts${search ? `?search=${encodeURIComponent(search)}` : ''}`,
      ),
    enabled,
    staleTime: 30_000,
  });
}
