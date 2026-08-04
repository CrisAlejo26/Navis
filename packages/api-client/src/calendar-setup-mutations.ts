import type {
  Congregation,
  CreateCongregationInput,
  CreatePatternInput,
  MeetingPattern,
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
      api.post<Congregation>('/calendar/congregations', { ...input }),
    onSuccess: () => refresh(client),
  });
}

export function useUpdateCongregation(api: ApiClient) {
  const client = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...input }: UpdateCongregationInput & { id: string }) =>
      api.patch<Congregation>(`/calendar/congregations/${id}`, { ...input }),
    onSuccess: () => refresh(client),
  });
}

export function useDeleteCongregation(api: ApiClient) {
  const client = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.delete<void>(`/calendar/congregations/${id}`),
    onSuccess: () => refresh(client),
  });
}

export function useCreatePattern(api: ApiClient) {
  const client = useQueryClient();

  return useMutation({
    mutationFn: (input: CreatePatternInput) =>
      api.post<MeetingPattern>('/calendar/patterns', { ...input }),
    onSuccess: () => refresh(client),
  });
}

export function useUpdatePattern(api: ApiClient) {
  const client = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...input }: UpdatePatternInput & { id: string }) =>
      api.patch<MeetingPattern>(`/calendar/patterns/${id}`, { ...input }),
    onSuccess: () => refresh(client),
  });
}

export function useDeletePattern(api: ApiClient) {
  const client = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.delete<void>(`/calendar/patterns/${id}`),
    onSuccess: () => refresh(client),
  });
}
