import type { Believer, CreateBelieverInput, UpdateBelieverInput } from '@navis/shared';
import { useMutation, useQuery, useQueryClient, type UseQueryResult } from '@tanstack/react-query';

import type { ApiClient } from './client';
import { queryKeys } from './query-keys';

export interface BelieversQuery {
  q?: string;
  ministry?: string;
  includeInactive?: boolean;
}

export function useBelievers(
  api: ApiClient,
  query: BelieversQuery = {},
  enabled = true,
): UseQueryResult<Believer[]> {
  const params = new URLSearchParams();
  if (query.q) params.set('q', query.q);
  if (query.ministry) params.set('ministry', query.ministry);
  if (query.includeInactive) params.set('includeInactive', 'true');

  return useQuery({
    queryKey: queryKeys.believers.list(query),
    queryFn: () => api.get<Believer[]>(`/believers?${params.toString()}`),
    enabled,
    staleTime: 60_000,
  });
}

/**
 * Al tocar a una persona se invalida también el calendario: su nombre sale en
 * la cinta de cada reunión que ocupa.
 */
function refresh(client: ReturnType<typeof useQueryClient>) {
  return Promise.all([
    client.invalidateQueries({ queryKey: queryKeys.believers.all }),
    client.invalidateQueries({ queryKey: queryKeys.calendar.all }),
  ]);
}

export function useCreateBeliever(api: ApiClient) {
  const client = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateBelieverInput) => api.post<Believer>('/believers', { ...input }),
    onSuccess: () => refresh(client),
  });
}

export function useUpdateBeliever(api: ApiClient) {
  const client = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...input }: UpdateBelieverInput & { id: string }) =>
      api.patch<Believer>(`/believers/${id}`, { ...input }),
    onSuccess: () => refresh(client),
  });
}

export function useDeleteBeliever(api: ApiClient) {
  const client = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.delete<void>(`/believers/${id}`),
    onSuccess: () => refresh(client),
  });
}
