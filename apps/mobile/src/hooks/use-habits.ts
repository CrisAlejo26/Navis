import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { listHabits, findHabit, habitRange } from '@/data/repos/habits-repo';
import type { TasksContext } from '@/data/repos/tasks-context';
import type { ActivityQuery } from '@/data/repos/activity-query';
import { useListContext } from './use-lists';

export const habitsKey = (scope: TasksContext) =>
    ['local-habits', scope.churchId, scope.userId] as const;
export function useHabits(query: ActivityQuery, today: string) {
    const { context, enabled } = useListContext();
    return useInfiniteQuery({
        queryKey: [...habitsKey(context), 'list', query, today],
        enabled,
        initialPageParam: 1,
        queryFn: ({ pageParam }) => listHabits(context, { ...query, page: pageParam }, today),
        getNextPageParam: (last) => (last.page < last.totalPages ? last.page + 1 : undefined),
    });
}
export function useHabit(id: string) {
    const { context, enabled } = useListContext();
    return useQuery({
        queryKey: [...habitsKey(context), 'detail', id],
        enabled: enabled && Boolean(id),
        queryFn: () => findHabit(context, id),
    });
}
export function useHabitRange(from: string, to: string) {
    const { context, enabled } = useListContext();
    return useQuery({
        queryKey: [...habitsKey(context), 'range', from, to],
        enabled,
        queryFn: () => habitRange(context, from, to),
    });
}
export function useHabitMutation<T, R>(operation: (context: TasksContext, input: T) => Promise<R>) {
    const { context, enabled } = useListContext(),
        client = useQueryClient();
    return useMutation({
        mutationFn: (input: T) => {
            if (!enabled) throw new Error('not-found');
            return operation(context, input);
        },
        onSuccess: async () => {
            await client.invalidateQueries({ queryKey: habitsKey(context) });
            await client.invalidateQueries({
                queryKey: ['local-activities', context.churchId, context.userId],
            });
        },
    });
}
