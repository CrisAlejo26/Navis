import type { CreateMinistryInput, MinistryCatalog, UpdateMinistryInput } from '@navis/shared';
import { useMutation, useQuery, useQueryClient, type UseQueryResult } from '@tanstack/react-query';

import type { ApiClient } from './client';
import { queryKeys } from './query-keys';

/**
 * El catálogo de **labores** de la iglesia.
 *
 * Gemelo del de dones y con la misma caché larga: son siete filas que cambian
 * una vez al año y las consultan el listado, la ficha y el formulario de alta.
 */
export function useMinistries(api: ApiClient, enabled = true): UseQueryResult<MinistryCatalog[]> {
  return useQuery({
    queryKey: queryKeys.believers.ministries,
    queryFn: () => api.get<MinistryCatalog[]>('/ministries'),
    enabled,
    staleTime: 300_000,
  });
}

/** Renombrar o apagar una labor cambia lo que se pinta en cada ficha y cada fila. */
function refresh(client: ReturnType<typeof useQueryClient>) {
  return client.invalidateQueries({ queryKey: queryKeys.believers.all });
}

export function useCreateMinistry(api: ApiClient) {
  const client = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateMinistryInput) =>
      api.post<MinistryCatalog>('/ministries', { ...input }),
    onSuccess: () => refresh(client),
  });
}

export function useUpdateMinistry(api: ApiClient) {
  const client = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...input }: UpdateMinistryInput & { id: string }) =>
      api.patch<MinistryCatalog>(`/ministries/${id}`, { ...input }),
    onSuccess: () => refresh(client),
  });
}

export function useDeleteMinistry(api: ApiClient) {
  const client = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.delete<void>(`/ministries/${id}`),
    onSuccess: () => refresh(client),
  });
}
