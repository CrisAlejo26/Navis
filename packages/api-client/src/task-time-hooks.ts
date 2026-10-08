import type {
    RunningTimer,
    RunningTimerState,
    TaskTime,
    TaskTimeEntry,
    TaskTimeSummary,
} from '@navis/shared';
import { useMutation, useQuery, useQueryClient, type UseQueryResult } from '@tanstack/react-query';

import type { ApiClient } from './client';
import { queryKeys } from './query-keys';

/** El cronómetro en marcha de la persona (Fase 7c), o `null`. Sale de `{ timer }`. */
export function useRunningTimer(
    api: ApiClient,
    enabled = true,
): UseQueryResult<RunningTimer | null> {
    return useQuery({
        queryKey: queryKeys.tasks.timeRunning,
        queryFn: async () => (await api.get<RunningTimerState>('/tasks/time/running')).timer,
        enabled,
        staleTime: 10_000,
    });
}

/** Las entradas de una tarea y su total de las cerradas. */
export function useTaskTime(api: ApiClient, id: string, enabled = true): UseQueryResult<TaskTime> {
    return useQuery({
        queryKey: queryKeys.tasks.timeOf(id),
        queryFn: () => api.get<TaskTime>(`/tasks/${id}/time`),
        enabled: enabled && Boolean(id),
        staleTime: 10_000,
    });
}

/** El tiempo trabajado del rango, por tarea y por flujo. */
export function useTimeSummary(
    api: ApiClient,
    range: { from: string; to: string },
    enabled = true,
): UseQueryResult<TaskTimeSummary> {
    return useQuery({
        queryKey: queryKeys.tasks.timeSummary(range),
        queryFn: () =>
            api.get<TaskTimeSummary>(`/tasks/time/summary?from=${range.from}&to=${range.to}`),
        enabled,
        staleTime: 30_000,
    });
}

/** Empezar, parar o borrar mueve el cronómetro, el tiempo de la tarea y el resumen a la vez. */
function refreshTime(client: ReturnType<typeof useQueryClient>) {
    return client.invalidateQueries({ queryKey: queryKeys.tasks.time });
}

export function useStartTimer(api: ApiClient) {
    const client = useQueryClient();
    return useMutation({
        mutationFn: (taskId: string) => api.post<RunningTimer>(`/tasks/${taskId}/time/start`, {}),
        onSuccess: () => refreshTime(client),
    });
}

export function useStopTimer(api: ApiClient) {
    const client = useQueryClient();
    return useMutation({
        mutationFn: () => api.post<TaskTimeEntry>('/tasks/time/stop', {}),
        onSuccess: () => refreshTime(client),
    });
}

export function useDeleteTimeEntry(api: ApiClient) {
    const client = useQueryClient();
    return useMutation({
        mutationFn: (entryId: string) => api.delete<void>(`/tasks/time/entries/${entryId}`),
        onSuccess: () => refreshTime(client),
    });
}
