import type { ExportResponse, RowData } from '@navis/shared';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import type { ApiClient } from './client';
import { queryKeys } from './query-keys';

/**
 * Las filas de una tabla para exportarlas, con la vista y los filtros activos
 * (RFC 0021 D23). Las contraseñas se piden aparte, solo tras el aviso.
 */
export function useTableExport(
  api: ApiClient,
  tableId: string,
  query: { search?: string; filters?: string; includePasswords?: boolean },
  enabled = true,
): UseQueryResult<ExportResponse<RowData>> {
  const params = new URLSearchParams();
  if (query.search) params.set('search', query.search);
  if (query.filters) params.set('filters', query.filters);
  if (query.includePasswords) params.set('includePasswords', 'true');
  const search = params.toString();

  return useQuery({
    queryKey: [...queryKeys.tables.all, 'export', tableId, search],
    queryFn: () => api.get<ExportResponse<RowData>>(`/tables/${tableId}/export?${search}`),
    enabled: enabled && Boolean(tableId),
    staleTime: 30_000,
  });
}
