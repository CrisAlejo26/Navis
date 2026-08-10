import type {
  CreateMessageInput,
  ForwardMessageInput,
  Message,
  UpdateMessageInput,
} from '@navis/shared';
import { useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query';

import type { ApiClient } from './client';
import { queryKeys } from './query-keys';

/**
 * Casi toda acción sobre un mensaje también cambia la fila del canal en la
 * bandeja (último mensaje, no leídos): se invalida toda la raíz de chat, como
 * ya hace `note-hooks.ts` con `believers.all`.
 */
function refresh(client: QueryClient) {
  return client.invalidateQueries({ queryKey: queryKeys.chat.all });
}

export function useSendMessage(api: ApiClient, channelId: string) {
  const client = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateMessageInput) =>
      api.post<Message>(`/channels/${channelId}/messages`, { ...input }),
    onSuccess: () => refresh(client),
  });
}

export function useEditMessage(api: ApiClient) {
  const client = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...input }: UpdateMessageInput & { id: string }) =>
      api.patch<Message>(`/messages/${id}`, { ...input }),
    onSuccess: () => refresh(client),
  });
}

export function useDeleteMessage(api: ApiClient) {
  const client = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.delete<void>(`/messages/${id}`),
    onSuccess: () => refresh(client),
  });
}

export function useReactToMessage(api: ApiClient) {
  const client = useQueryClient();

  return useMutation({
    mutationFn: ({ id, emoji }: { id: string; emoji: string }) =>
      api.post<void>(`/messages/${id}/reactions`, { emoji }),
    onSuccess: () => refresh(client),
  });
}

export function useRemoveReaction(api: ApiClient) {
  const client = useQueryClient();

  return useMutation({
    mutationFn: ({ id, emoji }: { id: string; emoji: string }) =>
      api.delete<void>(`/messages/${id}/reactions/${encodeURIComponent(emoji)}`),
    onSuccess: () => refresh(client),
  });
}

export function useForwardMessage(api: ApiClient) {
  const client = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...input }: ForwardMessageInput & { id: string }) =>
      api.post<Message[]>(`/messages/${id}/forward`, { ...input }),
    onSuccess: () => refresh(client),
  });
}
