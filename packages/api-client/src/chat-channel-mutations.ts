import type { ChannelDetail, CreateChannelInput, UpdateChannelInput } from '@navis/shared';
import {
  useMutation,
  useQueryClient,
  type UseMutationResult,
  type QueryClient,
} from '@tanstack/react-query';

import type { ApiClient } from './client';
import { queryKeys } from './query-keys';

/** Casi toda acción sobre un canal cambia su fila en la bandeja: se invalida la raíz. */
function refresh(client: QueryClient) {
  return client.invalidateQueries({ queryKey: queryKeys.chat.all });
}

export function useCreateChannel(
  api: ApiClient,
): UseMutationResult<ChannelDetail, Error, CreateChannelInput> {
  const client = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateChannelInput) => api.post<ChannelDetail>('/channels', { ...input }),
    onSuccess: () => refresh(client),
  });
}

export function useUpdateChannel(api: ApiClient) {
  const client = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...input }: UpdateChannelInput & { id: string }) =>
      api.patch<ChannelDetail>(`/channels/${id}`, { ...input }),
    onSuccess: () => refresh(client),
  });
}

export function useArchiveChannel(api: ApiClient) {
  const client = useQueryClient();

  return useMutation({
    mutationFn: ({ id, archived }: { id: string; archived: boolean }) =>
      api.post<void>(`/channels/${id}/${archived ? 'archive' : 'unarchive'}`),
    onSuccess: () => refresh(client),
  });
}

/** Archivo global (D2): solo pastor o superadministrador — el servidor lo exige igualmente. */
export function useGlobalArchiveChannel(api: ApiClient) {
  const client = useQueryClient();

  return useMutation({
    mutationFn: ({ id, archived }: { id: string; archived: boolean }) =>
      api.post<void>(`/channels/${id}/${archived ? 'global-archive' : 'global-unarchive'}`),
    onSuccess: () => refresh(client),
  });
}

export function useClearChannelHistory(api: ApiClient) {
  const client = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.post<void>(`/channels/${id}/clear`),
    onSuccess: (_data, id) => {
      void refresh(client);
      void client.invalidateQueries({ queryKey: queryKeys.chat.messages(id) });
    },
  });
}

export function useMarkChannelRead(api: ApiClient) {
  const client = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.post<void>(`/channels/${id}/read`),
    onSuccess: () => refresh(client),
  });
}

export function useMuteChannel(api: ApiClient) {
  const client = useQueryClient();

  return useMutation({
    mutationFn: ({ id, until }: { id: string; until?: string }) =>
      until
        ? api.post<void>(`/channels/${id}/mute`, { until })
        : api.post<void>(`/channels/${id}/unmute`),
    onSuccess: () => refresh(client),
  });
}

export function useLeaveChannel(api: ApiClient) {
  const client = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.post<void>(`/channels/${id}/leave`),
    onSuccess: () => refresh(client),
  });
}
