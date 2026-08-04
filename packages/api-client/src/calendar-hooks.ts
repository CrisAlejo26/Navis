import type {
  Calendar,
  CalendarRange,
  CalendarSummary,
  Congregation,
  MeetingPattern,
  Preacher,
} from '@navis/shared';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import type { ApiClient } from './client';
import { queryKeys } from './query-keys';

export interface CalendarQuery {
  /** De qué calendario: púlpito, sonido… (D15). */
  calendarId: string;
  from: string;
  to: string;
  /** Sedes a las que acotar. Vacío es «todas». */
  congregationIds?: readonly string[];
}

/** `?from=…&to=…&congregation=a,b` */
function toSearch({ from, to, congregationIds }: CalendarQuery): string {
  const params = new URLSearchParams({ from, to });
  if (congregationIds?.length) params.set('congregation', congregationIds.join(','));
  return params.toString();
}

/** Clave estable: dos vistas del mismo tramo comparten caché. */
function keyOf(query: CalendarQuery): {
  calendarId: string;
  from: string;
  to: string;
  congregations: string;
} {
  return {
    calendarId: query.calendarId,
    from: query.from,
    to: query.to,
    congregations: [...(query.congregationIds ?? [])].sort().join(','),
  };
}

/**
 * El calendario de un tramo, con las reuniones propuestas por los patrones ya
 * expandidas. Es la consulta que sostiene las cuatro vistas.
 */
export function useCalendar(
  api: ApiClient,
  query: CalendarQuery,
  enabled = true,
): UseQueryResult<CalendarRange> {
  return useQuery({
    queryKey: queryKeys.calendar.range(keyOf(query)),
    queryFn: () =>
      api.get<CalendarRange>(`/calendars/${query.calendarId}/schedule?${toSearch(query)}`),
    enabled: enabled && Boolean(query.calendarId),
    staleTime: 30_000,
    placeholderData: (previous) => previous,
  });
}

/** El reparto del tramo y los avisos. */
export function useCalendarSummary(
  api: ApiClient,
  query: CalendarQuery,
  enabled = true,
): UseQueryResult<CalendarSummary> {
  return useQuery({
    queryKey: queryKeys.calendar.summary(keyOf(query)),
    queryFn: () =>
      api.get<CalendarSummary>(`/calendars/${query.calendarId}/summary?${toSearch(query)}`),
    enabled: enabled && Boolean(query.calendarId),
    staleTime: 30_000,
  });
}

export function useCongregations(api: ApiClient, enabled = true): UseQueryResult<Congregation[]> {
  return useQuery({
    queryKey: queryKeys.calendar.congregations,
    queryFn: () => api.get<Congregation[]>('/congregations'),
    enabled,
    staleTime: 300_000,
  });
}

export function usePatterns(
  api: ApiClient,
  calendarId: string,
  enabled = true,
): UseQueryResult<MeetingPattern[]> {
  return useQuery({
    queryKey: queryKeys.calendar.patterns(calendarId),
    queryFn: () => api.get<MeetingPattern[]>(`/calendars/${calendarId}/patterns`),
    enabled: enabled && Boolean(calendarId),
    staleTime: 300_000,
  });
}

/** Los calendarios de la iglesia. De aquí salen las subentradas de la barra. */
export function useCalendars(api: ApiClient, enabled = true): UseQueryResult<Calendar[]> {
  return useQuery({
    queryKey: queryKeys.calendar.calendars,
    queryFn: () => api.get<Calendar[]>('/calendars'),
    enabled,
    staleTime: 300_000,
  });
}

export interface PreachersQuery extends CalendarQuery {
  q?: string;
  /** Cualquier creyente activo, no solo quien tiene el ministerio de púlpito. */
  all?: boolean;
}

/**
 * Los candidatos del selector, ya ordenados por quien lleva más tiempo sin
 * subir. La lista es corta y se consulta mucho: se cachea un rato.
 */
export function usePreachers(
  api: ApiClient,
  query: PreachersQuery,
  enabled = true,
): UseQueryResult<Preacher[]> {
  const params = new URLSearchParams({ from: query.from, to: query.to });
  if (query.q) params.set('q', query.q);
  if (query.all) params.set('all', 'true');

  return useQuery({
    queryKey: queryKeys.calendar.preachers({ ...keyOf(query), q: query.q ?? '', all: !!query.all }),
    queryFn: () =>
      api.get<Preacher[]>(`/calendars/${query.calendarId}/preachers?${params.toString()}`),
    enabled: enabled && Boolean(query.calendarId),
    staleTime: 30_000,
  });
}
