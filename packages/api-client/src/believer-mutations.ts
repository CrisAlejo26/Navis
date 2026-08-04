import type { BelieverListItem, CreateBelieverInput, UpdateBelieverInput } from '@navis/shared';
import { useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query';

import type { ApiClient } from './client';
import { queryKeys } from './query-keys';

/**
 * Al tocar a una persona se invalida también el calendario: su nombre sale en
 * la cinta de cada reunión que ocupa, y su estado decide si se le propone.
 */
export function refreshBelievers(client: QueryClient): Promise<unknown> {
  return Promise.all([
    client.invalidateQueries({ queryKey: queryKeys.believers.all }),
    client.invalidateQueries({ queryKey: queryKeys.calendar.all }),
  ]);
}

export function useCreateBeliever(api: ApiClient) {
  const client = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateBelieverInput) =>
      api.post<BelieverListItem>('/believers', { ...input }),
    onSuccess: () => refreshBelievers(client),
  });
}

export function useUpdateBeliever(api: ApiClient) {
  const client = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...input }: UpdateBelieverInput & { id: string }) =>
      api.patch<BelieverListItem>(`/believers/${id}`, { ...input }),
    onSuccess: () => refreshBelievers(client),
  });
}

export function useDeleteBeliever(api: ApiClient) {
  const client = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.delete<void>(`/believers/${id}`),
    onSuccess: () => refreshBelievers(client),
  });
}

/**
 * La misma sede para varias personas de una vez.
 *
 * Existe porque quien se da de alta desde el selector de predicadores del
 * calendario nace sin sede, y ponérsela a treinta hermanos abriendo treinta
 * fichas es la clase de fricción que acaba en «ya lo haré».
 */
export function useSetCongregation(api: ApiClient) {
  const client = useQueryClient();

  return useMutation({
    mutationFn: (input: { believerIds: string[]; congregationId: string | null }) =>
      api.patch<{ updated: number }>('/believers/congregation', { ...input }),
    onSuccess: () => refreshBelievers(client),
  });
}
