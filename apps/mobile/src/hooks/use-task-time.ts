import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { todayIn } from '@navis/shared';
import {
    deleteTimeEntry,
    runningTimer,
    startTimer,
    stopTimer,
    taskTime,
    timeSummary,
} from '@/data/repos/task-time-repo';
import type { TasksContext } from '@/data/repos/tasks-context';
import { useListContext } from './use-lists';

const timeKey = (scope: TasksContext) => ['local-task-time', scope.churchId, scope.userId] as const;

/** El cronómetro en marcha de la persona (Fase 7c), o `null`. */
export function useRunningTimer() {
    const { context, enabled } = useListContext();
    return useQuery({
        queryKey: [...timeKey(context), 'running'],
        enabled,
        queryFn: () => runningTimer(context),
    });
}

export function useTaskTime(taskId: string) {
    const { context, enabled } = useListContext();
    return useQuery({
        queryKey: [...timeKey(context), 'of', taskId],
        enabled: enabled && Boolean(taskId),
        queryFn: () => taskTime(context, taskId),
    });
}

export function useTimeSummary(from: string, to: string) {
    const { context, enabled, church } = useListContext();
    const timezone = church?.timezone ?? 'UTC';
    return useQuery({
        queryKey: [...timeKey(context), 'summary', from, to, timezone],
        enabled,
        queryFn: () => timeSummary(context, from, to, timezone),
    });
}

/** Hoy en la zona de la iglesia: el extremo del resumen del tiempo. */
export function useChurchToday(): string {
    const { church } = useListContext();
    return todayIn(church?.timezone ?? 'UTC');
}

/** Empezar, parar o borrar mueve el cronómetro, el tiempo de la tarea y el resumen a la vez. */
export function useTimeMutation<T, R>(operation: (context: TasksContext, input: T) => Promise<R>) {
    const { context, enabled } = useListContext(),
        client = useQueryClient();
    return useMutation({
        mutationFn: (input: T) => {
            if (!enabled) throw new Error('not-found');
            return operation(context, input);
        },
        onSuccess: () => client.invalidateQueries({ queryKey: timeKey(context) }),
    });
}

export const useStartTimer = () =>
    useTimeMutation((context, taskId: string) => startTimer(context, taskId));
export const useStopTimer = () => useTimeMutation((context, _input: void) => stopTimer(context));
export const useDeleteTimeEntry = () =>
    useTimeMutation((context, id: string) => deleteTimeEntry(context, id));
