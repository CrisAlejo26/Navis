import type { CreateTableRowInput, CustomTableRow, UpdateTableRowInput } from '@navis/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { ApiClient } from './client';
import { queryKeys } from './query-keys';

function refreshRows(client: ReturnType<typeof useQueryClient>, tableId: string) {
  return client.invalidateQueries({ queryKey: [...queryKeys.tables.all, 'rows', tableId] });
}

export function useCreateTableRow(api: ApiClient) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ tableId, ...input }: CreateTableRowInput & { tableId: string }) =>
      api.post<CustomTableRow>(`/tables/${tableId}/rows`, { ...input }),
    onSuccess: (_data, { tableId }) => refreshRows(client, tableId),
  });
}

export function useUpdateTableRow(api: ApiClient) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      tableId,
      id,
      ...input
    }: UpdateTableRowInput & { tableId: string; id: string }) =>
      api.patch<CustomTableRow>(`/tables/${tableId}/rows/${id}`, { ...input }),
    onSuccess: (_data, { tableId }) => refreshRows(client, tableId),
  });
}

export function useDeleteTableRow(api: ApiClient) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ tableId, id }: { tableId: string; id: string }) =>
      api.delete<void>(`/tables/${tableId}/rows/${id}`),
    onSuccess: (_data, { tableId }) => refreshRows(client, tableId),
  });
}

/**
 * El texto claro de una celda de tipo contraseña (D22): un gesto explícito,
 * no una consulta cacheada — se pide cada vez que alguien pulsa «revelar».
 */
export function useRevealTableField(api: ApiClient) {
  return useMutation({
    mutationFn: ({
      tableId,
      rowId,
      columnKey,
    }: {
      tableId: string;
      rowId: string;
      columnKey: string;
    }) => api.get<{ value: string }>(`/tables/${tableId}/rows/${rowId}/reveal/${columnKey}`),
  });
}
