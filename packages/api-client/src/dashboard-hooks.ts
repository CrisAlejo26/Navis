import type { DashboardSummary } from '@navis/shared';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import type { ApiClient } from './client';
import { queryKeys } from './query-keys';

/**
 * Todo el panel de inicio, en una sola llamada (RFC 0001).
 *
 * El calendario de la semana de la propia portada no tiene hook aquí: pide
 * `useCalendars` y `useCalendar` (`calendar-hooks.ts`), que ya son la misma
 * consulta que usa la sección de calendario.
 */
export function useDashboardSummary(
  api: ApiClient,
  enabled = true,
): UseQueryResult<DashboardSummary> {
  return useQuery({
    queryKey: queryKeys.dashboard.summary,
    queryFn: () => api.get<DashboardSummary>('/dashboard/summary'),
    enabled,
    staleTime: 30_000,
  });
}
