import type { CreateTableViewInput, CustomTableView, UpdateTableViewInput } from '@navis/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { ApiClient } from './client';
import { queryKeys } from './query-keys';

function refresh(client: ReturnType<typeof useQueryClient>, tableId: string) {
  return client.invalidateQueries({ queryKey: queryKeys.tables.views(tableId) });
}

export function useCreateTableView(api: ApiClient) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ tableId, ...input }: CreateTableViewInput & { tableId: string }) =>
      api.post<CustomTableView>(`/tables/${tableId}/views`, { ...input }),
    onSuccess: (_data, { tableId }) => refresh(client, tableId),
  });
}

export function useUpdateTableView(api: ApiClient) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      tableId,
      id,
      ...input
    }: UpdateTableViewInput & { tableId: string; id: string }) =>
      api.patch<CustomTableView>(`/tables/${tableId}/views/${id}`, { ...input }),
    onSuccess: (_data, { tableId }) => refresh(client, tableId),
  });
}

export function useDeleteTableView(api: ApiClient) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ tableId, id }: { tableId: string; id: string }) =>
      api.delete<void>(`/tables/${tableId}/views/${id}`),
    onSuccess: (_data, { tableId }) => refresh(client, tableId),
  });
}
