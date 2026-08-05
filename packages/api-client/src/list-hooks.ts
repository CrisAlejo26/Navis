import type {
  ExportResponse,
  List,
  ListAccessEntry,
  ListExportRow,
  ListMember,
  ListMemberships,
  ListStats,
  ListSummary,
  ListViewer,
} from '@navis/shared';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import type { ApiClient } from './client';
import { queryKeys } from './query-keys';

/** La ficha: la lista con sus miembros ya ordenados por `position`. */
export type ListDetail = List & { members: ListMember[] };

/** El tablón. Se consulta en cada carga: de aquí salen las subentradas. */
export function useLists(api: ApiClient, enabled = true): UseQueryResult<ListSummary[]> {
  return useQuery({
    queryKey: queryKeys.lists.all,
    queryFn: () => api.get<ListSummary[]>('/lists'),
    enabled,
    staleTime: 60_000,
  });
}

export function useList(api: ApiClient, id: string, enabled = true): UseQueryResult<ListDetail> {
  return useQuery({
    queryKey: queryKeys.lists.one(id),
    queryFn: () => api.get<ListDetail>(`/lists/${id}`),
    enabled: enabled && Boolean(id),
  });
}

export function useListStats(
  api: ApiClient,
  id: string,
  enabled = true,
): UseQueryResult<ListStats> {
  return useQuery({
    queryKey: queryKeys.lists.stats(id),
    queryFn: () => api.get<ListStats>(`/lists/${id}/stats`),
    enabled: enabled && Boolean(id),
  });
}

/** Los últimos cincuenta intentos. Solo se pide en la pestaña de compartir. */
export function useListAccessLog(
  api: ApiClient,
  id: string,
  enabled = true,
): UseQueryResult<ListAccessEntry[]> {
  return useQuery({
    queryKey: queryKeys.lists.accessLog(id),
    queryFn: () => api.get<ListAccessEntry[]>(`/lists/${id}/access-log`),
    enabled: enabled && Boolean(id),
  });
}

/**
 * En qué listas está cada persona: **una sola llamada por iglesia**, cacheada.
 *
 * No sale de un `join` dentro del listado paginado: con relaciones cargadas,
 * `take`/`skip` de TypeORM se van a una subconsulta con `DISTINCT` y Postgres
 * exige entonces que todo lo ordenado esté en la lista de selección (§8.7).
 */
export function useListMemberships(
  api: ApiClient,
  enabled = true,
): UseQueryResult<ListMemberships> {
  return useQuery({
    queryKey: queryKeys.lists.memberships,
    queryFn: () => api.get<ListMemberships>('/lists/memberships'),
    enabled,
    staleTime: 60_000,
  });
}

/** El directorio de accesos de la iglesia, con a cuántas listas llega cada uno. */
export function useListViewers(api: ApiClient, enabled = true): UseQueryResult<ListViewer[]> {
  return useQuery({
    queryKey: queryKeys.lists.viewers,
    queryFn: () => api.get<ListViewer[]>('/list-viewers'),
    enabled,
    staleTime: 30_000,
  });
}

/** Las filas para exportar. Solo con el diálogo abierto (RFC 0009). */
export function useListExport(
  api: ApiClient,
  id: string,
  enabled = true,
): UseQueryResult<ExportResponse<ListExportRow>> {
  return useQuery({
    queryKey: [...queryKeys.lists.all, 'export', id],
    queryFn: () => api.get<ExportResponse<ListExportRow>>(`/lists/${id}/export`),
    enabled: enabled && Boolean(id),
    staleTime: 30_000,
  });
}
