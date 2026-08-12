import type { CreateHabitInput, Habit, HabitStatus, UpdateHabitInput } from '@navis/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { ApiClient } from './client';
import { queryKeys } from './query-keys';

function refresh(client: ReturnType<typeof useQueryClient>) {
  return client.invalidateQueries({ queryKey: queryKeys.tasks.all });
}

export function useCreateHabit(api: ApiClient) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateHabitInput) => api.post<Habit>('/habits', { ...input }),
    onSuccess: () => refresh(client),
  });
}

export function useUpdateHabit(api: ApiClient) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: UpdateHabitInput & { id: string }) =>
      api.patch<Habit>(`/habits/${id}`, { ...input }),
    onSuccess: () => refresh(client),
  });
}

export function useDeleteHabit(api: ApiClient) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<void>(`/habits/${id}`),
    onSuccess: () => refresh(client),
  });
}

export function useSetHabitOccurrence(api: ApiClient) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      habitId,
      date,
      status,
    }: {
      habitId: string;
      date: string;
      status: HabitStatus;
    }) => api.put<void>(`/habits/${habitId}/occurrences/${date}`, { status }),
    onSuccess: () => refresh(client),
  });
}
