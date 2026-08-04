import type {
  Calendar,
  Congregation,
  CreateCalendarInput,
  CreateCongregationInput,
  CreatePatternInput,
  MeetingPattern,
  UpdateCalendarInput,
  UpdateCongregationInput,
  UpdatePatternInput,
} from '@navis/shared';
import { useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query';

import type { ApiClient } from './client';
import { queryKeys } from './query-keys';

/** Todo lo del calendario cuelga de la misma raíz: se invalida de una vez. */
const refresh = (client: QueryClient) =>
  client.invalidateQueries({ queryKey: queryKeys.calendar.all });

/**
 * Lo que se configura una vez y sostiene el resto: las **sedes** de la iglesia
 * y sus **reuniones fijas** (RFC 0002 §8.2).
 */
export function useCreateCongregation(api: ApiClient) {
  const client = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateCongregationInput) =>
      api.post<Congregation>('/congregations', { ...input }),
    onSuccess: () => refresh(client),
  });
}

export function useUpdateCongregation(api: ApiClient) {
  const client = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...input }: UpdateCongregationInput & { id: string }) =>
      api.patch<Congregation>(`/congregations/${id}`, { ...input }),
    onSuccess: () => refresh(client),
  });
}

export function useDeleteCongregation(api: ApiClient) {
  const client = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.delete<void>(`/congregations/${id}`),
    onSuccess: () => refresh(client),
  });
}

export function useCreatePattern(api: ApiClient, calendarId: string) {
  const client = useQueryClient();

  return useMutation({
    mutationFn: (input: CreatePatternInput) =>
      api.post<MeetingPattern>(`/calendars/${calendarId}/patterns`, { ...input }),
    onSuccess: () => refresh(client),
  });
}

export function useUpdatePattern(api: ApiClient, calendarId: string) {
  const client = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...input }: UpdatePatternInput & { id: string }) =>
      api.patch<MeetingPattern>(`/calendars/${calendarId}/patterns/${id}`, { ...input }),
    onSuccess: () => refresh(client),
  });
}

export function useDeletePattern(api: ApiClient, calendarId: string) {
  const client = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.delete<void>(`/calendars/${calendarId}/patterns/${id}`),
    onSuccess: () => refresh(client),
  });
}

/** Los calendarios: crear, renombrar y borrar (D15). */
export function useCreateCalendar(api: ApiClient) {
  const client = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateCalendarInput) => api.post<Calendar>('/calendars', { ...input }),
    onSuccess: () => refresh(client),
  });
}

export function useUpdateCalendar(api: ApiClient) {
  const client = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...input }: UpdateCalendarInput & { id: string }) =>
      api.patch<Calendar>(`/calendars/${id}`, { ...input }),
    onSuccess: () => refresh(client),
  });
}

export function useDeleteCalendar(api: ApiClient) {
  const client = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.delete<void>(`/calendars/${id}`),
    onSuccess: () => refresh(client),
  });
}
