import type {
  AddListMembersInput,
  CreateListInput,
  List,
  ListMember,
  UpdateListInput,
  UpdateListMemberInput,
} from '@navis/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { ApiClient } from './client';
import { queryKeys } from './query-keys';

/**
 * Todo lo de listas se invalida junto.
 *
 * Meter a una persona cambia el panel del tablón, la ficha, el solapamiento y
 * los puntos que salen en creyentes: acertar cuál de las cinco consultas hay que
 * refrescar en cada caso sale más caro que invalidar la raíz.
 *
 * `believers.all` también, porque los puntos y el filtro por lista viven ahí.
 */
function refresh(client: ReturnType<typeof useQueryClient>) {
  return Promise.all([
    client.invalidateQueries({ queryKey: queryKeys.lists.all }),
    client.invalidateQueries({ queryKey: queryKeys.believers.all }),
  ]);
}

export function useCreateList(api: ApiClient) {
  const client = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateListInput) => api.post<List>('/lists', { ...input }),
    onSuccess: () => refresh(client),
  });
}

export function useUpdateList(api: ApiClient) {
  const client = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...input }: UpdateListInput & { id: string }) =>
      api.patch<List>(`/lists/${id}`, { ...input }),
    onSuccess: () => refresh(client),
  });
}

export function useDeleteList(api: ApiClient) {
  const client = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.delete<void>(`/lists/${id}`),
    onSuccess: () => refresh(client),
  });
}

export function useAddListMembers(api: ApiClient) {
  const client = useQueryClient();

  return useMutation({
    mutationFn: ({ listId, ...input }: AddListMembersInput & { listId: string }) =>
      api.post<ListMember[]>(`/lists/${listId}/members`, { ...input }),
    onSuccess: () => refresh(client),
  });
}

export function useRemoveListMember(api: ApiClient) {
  const client = useQueryClient();

  return useMutation({
    mutationFn: ({ listId, believerId }: { listId: string; believerId: string }) =>
      api.delete<void>(`/lists/${listId}/members/${believerId}`),
    onSuccess: () => refresh(client),
  });
}

export function useUpdateListMember(api: ApiClient) {
  const client = useQueryClient();

  return useMutation({
    mutationFn: ({
      listId,
      believerId,
      ...input
    }: UpdateListMemberInput & { listId: string; believerId: string }) =>
      api.patch<ListMember[]>(`/lists/${listId}/members/${believerId}`, { ...input }),
    onSuccess: () => refresh(client),
  });
}

/** El orden **entero**, no «sube uno» (D6). */
export function useReorderList(api: ApiClient) {
  const client = useQueryClient();

  return useMutation({
    mutationFn: ({ listId, believerIds }: { listId: string; believerIds: string[] }) =>
      api.put<ListMember[]>(`/lists/${listId}/order`, { believerIds }),
    onSuccess: () => refresh(client),
  });
}

/* Publicar tiene su propio fichero (`list-share-mutations`): es otro permiso y
   otra decisión, y aquí están solo las que cambian lo que hay dentro. */
