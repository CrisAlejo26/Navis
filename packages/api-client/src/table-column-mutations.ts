import type {
  CreateTableColumnInput,
  CustomTableColumn,
  UpdateTableColumnInput,
} from '@navis/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { ApiClient } from './client';
import { queryKeys } from './query-keys';

/** Cambiar una columna toca la ficha y todas las páginas de filas ya cacheadas. */
function refresh(client: ReturnType<typeof useQueryClient>, tableId: string) {
  return client
    .invalidateQueries({ queryKey: queryKeys.tables.one(tableId) })
    .then(() => client.invalidateQueries({ queryKey: [...queryKeys.tables.all, 'rows', tableId] }));
}

export function useCreateTableColumn(api: ApiClient) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ tableId, ...input }: CreateTableColumnInput & { tableId: string }) =>
      api.post<CustomTableColumn>(`/tables/${tableId}/columns`, { ...input }),
    onSuccess: (_data, { tableId }) => refresh(client, tableId),
  });
}

export function useUpdateTableColumn(api: ApiClient) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      tableId,
      id,
      ...input
    }: UpdateTableColumnInput & { tableId: string; id: string }) =>
      api.patch<CustomTableColumn>(`/tables/${tableId}/columns/${id}`, { ...input }),
    onSuccess: (_data, { tableId }) => refresh(client, tableId),
  });
}

export function useDeleteTableColumn(api: ApiClient) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ tableId, id }: { tableId: string; id: string }) =>
      api.delete<void>(`/tables/${tableId}/columns/${id}`),
    onSuccess: (_data, { tableId }) => refresh(client, tableId),
  });
}

export function useReorderTableColumns(api: ApiClient) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ tableId, columnIds }: { tableId: string; columnIds: string[] }) =>
      api.put<CustomTableColumn[]>(`/tables/${tableId}/columns/order`, { columnIds }),
    onSuccess: (_data, { tableId }) => refresh(client, tableId),
  });
}
