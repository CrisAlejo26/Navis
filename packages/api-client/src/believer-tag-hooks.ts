import type { BelieverTag, CreateBelieverTagInput, UpdateBelieverTagInput } from '@navis/shared';
import { useMutation, useQuery, useQueryClient, type UseQueryResult } from '@tanstack/react-query';

import type { ApiClient } from './client';
import { queryKeys } from './query-keys';

/**
 * El catálogo de etiquetas de creyente de la iglesia.
 *
 * Se cachea largo, como los dones: son pocas filas que cambian poco y las
 * consultan el listado, la ficha y el formulario de alta.
 */
export function useBelieverTags(api: ApiClient, enabled = true): UseQueryResult<BelieverTag[]> {
  return useQuery({
    queryKey: queryKeys.believers.tags,
    queryFn: () => api.get<BelieverTag[]>('/believer-tags'),
    enabled,
    staleTime: 300_000,
  });
}

/** Crear, renombrar o apagar una etiqueta cambia lo que se pinta en cada ficha y cada fila. */
function refresh(client: ReturnType<typeof useQueryClient>) {
  return client.invalidateQueries({ queryKey: queryKeys.believers.all });
}

export function useCreateBelieverTag(api: ApiClient) {
  const client = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateBelieverTagInput) =>
      api.post<BelieverTag>('/believer-tags', { ...input }),
    onSuccess: () => refresh(client),
  });
}

export function useUpdateBelieverTag(api: ApiClient) {
  const client = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...input }: UpdateBelieverTagInput & { id: string }) =>
      api.patch<BelieverTag>(`/believer-tags/${id}`, { ...input }),
    onSuccess: () => refresh(client),
  });
}

export function useDeleteBelieverTag(api: ApiClient) {
  const client = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.delete<void>(`/believer-tags/${id}`),
    onSuccess: () => refresh(client),
  });
}
