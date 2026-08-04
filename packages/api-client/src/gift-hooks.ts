import type { CreateGiftInput, Gift, UpdateGiftInput } from '@navis/shared';
import { useMutation, useQuery, useQueryClient, type UseQueryResult } from '@tanstack/react-query';

import type { ApiClient } from './client';
import { queryKeys } from './query-keys';

/**
 * El catálogo de dones de la iglesia (RFC 0003 D5).
 *
 * Se cachea largo: son siete filas que cambian una vez al año y las consultan
 * el listado, la ficha, el formulario de alta y el de nota.
 */
export function useGifts(api: ApiClient, enabled = true): UseQueryResult<Gift[]> {
  return useQuery({
    queryKey: queryKeys.believers.gifts,
    queryFn: () => api.get<Gift[]>('/gifts'),
    enabled,
    staleTime: 300_000,
  });
}

/** Renombrar o apagar un don cambia lo que se pinta en cada ficha y cada fila. */
function refresh(client: ReturnType<typeof useQueryClient>) {
  return client.invalidateQueries({ queryKey: queryKeys.believers.all });
}

export function useCreateGift(api: ApiClient) {
  const client = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateGiftInput) => api.post<Gift>('/gifts', { ...input }),
    onSuccess: () => refresh(client),
  });
}

export function useUpdateGift(api: ApiClient) {
  const client = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...input }: UpdateGiftInput & { id: string }) =>
      api.patch<Gift>(`/gifts/${id}`, { ...input }),
    onSuccess: () => refresh(client),
  });
}

export function useDeleteGift(api: ApiClient) {
  const client = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.delete<void>(`/gifts/${id}`),
    onSuccess: () => refresh(client),
  });
}
