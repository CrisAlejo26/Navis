import type { CreateCustomTableInput, CustomTable, UpdateCustomTableInput } from '@navis/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { ApiClient } from './client';
import { queryKeys } from './query-keys';

/** Todo lo de tablas se invalida junto: cuelga de la misma raíz (RFC 0021). */
function refresh(client: ReturnType<typeof useQueryClient>) {
  return client.invalidateQueries({ queryKey: queryKeys.tables.all });
}

export function useCreateTable(api: ApiClient) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateCustomTableInput) => api.post<CustomTable>('/tables', { ...input }),
    onSuccess: () => refresh(client),
  });
}

export function useUpdateTable(api: ApiClient) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: UpdateCustomTableInput & { id: string }) =>
      api.patch<CustomTable>(`/tables/${id}`, { ...input }),
    onSuccess: () => refresh(client),
  });
}

export function useDeleteTable(api: ApiClient) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<void>(`/tables/${id}`),
    onSuccess: () => refresh(client),
  });
}
