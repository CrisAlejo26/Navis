import type {
  BelieverExportRow,
  BelieversQuery,
  DreamExportRow,
  DreamsQuery,
  ExportResponse,
  ExportSelection,
  PropheciesQuery,
  ProphecyExportRow,
} from '@navis/shared';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import { toBelieverSearch } from './believer-hooks';
import type { ApiClient } from './client';
import { toDreamSearch } from './dream-hooks';
import { toSearch as toProphecySearch } from './prophecy-hooks';
import { queryKeys } from './query-keys';

/**
 * Las filas de una exportación (RFC 0009 §6).
 *
 * Cuelgan de la misma raíz que su listado —`queryKeys.believers.all` y
 * compañía— para que al escribir una nota o cumplir una profecía se invaliden
 * solas con todo lo demás.
 *
 * Solo se piden cuando el diálogo está abierto (`enabled`): son hasta dos mil
 * filas con el cuerpo entero, y eso no viaja «por si acaso».
 */
export function useBelieversExport(
  api: ApiClient,
  query: BelieversQuery & ExportSelection,
  enabled = true,
): UseQueryResult<ExportResponse<BelieverExportRow>> {
  const search = withIds(toBelieverSearch(query), query.ids);

  return useQuery({
    queryKey: [...queryKeys.believers.all, 'export', search],
    queryFn: () => api.get<ExportResponse<BelieverExportRow>>(`/believers/export?${search}`),
    enabled,
    staleTime: 30_000,
  });
}

export function usePropheciesExport(
  api: ApiClient,
  query: PropheciesQuery & ExportSelection,
  enabled = true,
): UseQueryResult<ExportResponse<ProphecyExportRow>> {
  const search = withIds(toProphecySearch(query), query.ids);

  return useQuery({
    queryKey: [...queryKeys.prophecies.all, 'export', search],
    queryFn: () => api.get<ExportResponse<ProphecyExportRow>>(`/prophecies/export?${search}`),
    enabled,
    staleTime: 30_000,
  });
}

export function useDreamsExport(
  api: ApiClient,
  query: DreamsQuery & ExportSelection,
  enabled = true,
): UseQueryResult<ExportResponse<DreamExportRow>> {
  const search = withIds(toDreamSearch(query), query.ids);

  return useQuery({
    queryKey: [...queryKeys.dreams.all, 'export', search],
    queryFn: () => api.get<ExportResponse<DreamExportRow>>(`/dreams/export?${search}`),
    enabled,
    staleTime: 30_000,
  });
}

/**
 * Los identificadores de la selección, cuando la hay.
 *
 * Una selección **vacía** no viaja y se comporta como «sin selección»: la
 * interfaz no ofrece exportar cero filas marcadas, así que el caso no llega
 * aquí. En el servidor la regla es la contraria y más prudente —una selección
 * vacía devuelve cero filas—, por si algún día llega por otro camino.
 */
function withIds(search: string, ids: readonly string[] | undefined): string {
  if (!ids?.length) return search;

  const params = new URLSearchParams(search);
  for (const id of ids) params.append('ids', id);

  return params.toString();
}
