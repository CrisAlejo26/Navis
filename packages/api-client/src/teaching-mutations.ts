import type { CreateTeachingInput, Teaching, UpdateTeachingInput } from '@navis/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { ApiClient } from './client';
import { queryKeys } from './query-keys';

function refresh(client: ReturnType<typeof useQueryClient>) {
  return client.invalidateQueries({ queryKey: queryKeys.teachings.all });
}

export function useCreateTeaching(api: ApiClient) {
  const client = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateTeachingInput) => api.post<Teaching>('/teachings', { ...input }),
    onSuccess: () => refresh(client),
  });
}

export function useUpdateTeaching(api: ApiClient) {
  const client = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...input }: UpdateTeachingInput & { id: string }) =>
      api.patch<Teaching>(`/teachings/${id}`, { ...input }),
    onSuccess: () => refresh(client),
  });
}

export function useDeleteTeaching(api: ApiClient) {
  const client = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.delete<void>(`/teachings/${id}`),
    onSuccess: () => refresh(client),
  });
}
