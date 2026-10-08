import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    listTasks,
    findTask,
    taskRange,
    taskStreak,
    type TasksContext,
} from '@/data/repos/tasks-repo';
import type { ActivityQuery } from '@/data/repos/activity-query';
import { syncNotifications } from '@/lib/notifications/sync';
import { useListContext } from './use-lists';

export const tasksKey = (scope: TasksContext) =>
    ['local-tasks', scope.churchId, scope.userId] as const;
export function useTasks(query: ActivityQuery, today: string) {
    const { context, enabled } = useListContext();
    return useInfiniteQuery({
        queryKey: [...tasksKey(context), 'list', query, today],
        enabled,
        initialPageParam: 1,
        queryFn: ({ pageParam }) => listTasks(context, { ...query, page: pageParam }, today),
        getNextPageParam: (last) => (last.page < last.totalPages ? last.page + 1 : undefined),
    });
}
export function useTask(id: string) {
    const { context, enabled } = useListContext();
    return useQuery({
        queryKey: [...tasksKey(context), 'detail', id],
        enabled: enabled && Boolean(id),
        queryFn: () => findTask(context, id),
    });
}
export function useTaskRange(from: string, to: string) {
    const { context, enabled } = useListContext();
    return useQuery({
        queryKey: [...tasksKey(context), 'range', from, to],
        enabled,
        queryFn: () => taskRange(context, from, to),
    });
}
export function useTaskStreak(today: string) {
    const { context, enabled } = useListContext();
    return useQuery({
        queryKey: [...tasksKey(context), 'streak', today],
        enabled,
        queryFn: () => taskStreak(context, today),
    });
}
export function useTaskMutation<T, R>(operation: (context: TasksContext, input: T) => Promise<R>) {
    const { context, enabled } = useListContext(),
        client = useQueryClient();
    return useMutation({
        mutationFn: (input: T) => {
            if (!enabled) throw new Error('not-found');
            return operation(context, input);
        },
        onSuccess: async () => {
            // Un recordatorio nuevo, movido o borrado cambia lo que debe sonar.
            void syncNotifications();
            await client.invalidateQueries({
                queryKey: ['local-activities', context.churchId, context.userId],
            });
            await client.invalidateQueries({ queryKey: tasksKey(context) });
            await client.invalidateQueries({
                queryKey: ['local-habits', context.churchId, context.userId],
            });
            await client.invalidateQueries({
                queryKey: ['dashboard', context.churchId, context.userId],
            });
        },
    });
}
