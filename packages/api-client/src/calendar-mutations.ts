import type {
  CreateMeetingInput,
  Meeting,
  SetMeetingSlotsInput,
  UpdateMeetingInput,
} from '@navis/shared';
import { useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query';

import { isCalendarRange, withAssignment, type AssignVariables } from './calendar-cache';
import type { ApiClient } from './client';
import { queryKeys } from './query-keys';

/** Todo lo del calendario cuelga de la misma raíz: se invalida de una vez. */
const refresh = (client: QueryClient) =>
  client.invalidateQueries({ queryKey: queryKeys.calendar.all });

/**
 * Poner a alguien en una fase. Es la acción que más se repite, así que se
 * pinta al instante y se corrige si la API dice que no (§8.6).
 */
export function useAssignSlot(api: ApiClient) {
  const client = useQueryClient();

  return useMutation({
    mutationFn: ({ believerName: _name, ...input }: AssignVariables) =>
      api.put<Meeting>('/calendar/slots', { ...input }),

    onMutate: async (input: AssignVariables) => {
      await client.cancelQueries({ queryKey: queryKeys.calendar.all });
      const previous = client.getQueriesData({ queryKey: queryKeys.calendar.all });

      client.setQueriesData({ queryKey: queryKeys.calendar.all }, (data: unknown) =>
        isCalendarRange(data) ? withAssignment(data, input) : data,
      );

      return { previous };
    },

    onError: (_error, _input, context) => {
      for (const [key, data] of context?.previous ?? []) client.setQueryData(key, data);
    },

    onSettled: () => refresh(client),
  });
}

export function useCreateMeeting(api: ApiClient) {
  const client = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateMeetingInput) =>
      api.post<Meeting>('/calendar/meetings', { ...input }),
    onSuccess: () => refresh(client),
  });
}

export function useUpdateMeeting(api: ApiClient) {
  const client = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...input }: UpdateMeetingInput & { id: string }) =>
      api.patch<Meeting>(`/calendar/meetings/${id}`, { ...input }),
    onSuccess: () => refresh(client),
  });
}

export function useSetMeetingSlots(api: ApiClient) {
  const client = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...input }: SetMeetingSlotsInput & { id: string }) =>
      api.put<Meeting>(`/calendar/meetings/${id}/slots`, { ...input }),
    onSuccess: () => refresh(client),
  });
}

export function useDeleteMeeting(api: ApiClient) {
  const client = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.delete<void>(`/calendar/meetings/${id}`),
    onSuccess: () => refresh(client),
  });
}
