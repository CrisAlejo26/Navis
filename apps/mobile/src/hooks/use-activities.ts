import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listActivities, hasActivities, calendarActivities } from '@/data/repos/activities-repo';
import { setTaskStatus, deleteTask } from '@/data/repos/tasks-repo';
import { setHabitStatus, deleteHabit } from '@/data/repos/habits-repo';
import { useListContext } from './use-lists';
import { activityId, activityKind, type ActivityItem, type TaskFilters } from '@/lib/tasks/filters';
import type { TaskStatus } from '@navis/shared';
import type { DateRange } from '@/lib/ui/date-grid';

export function useActivities(query: TaskFilters, today: string, window?: DateRange) {
    const { context, enabled } = useListContext();
    return useInfiniteQuery({
        queryKey: ['local-activities', context.churchId, context.userId, query, today, window],
        enabled,
        initialPageParam: 1,
        queryFn: ({ pageParam }) =>
            listActivities(context, { ...query, page: pageParam }, today, window),
        getNextPageParam: (last) => (last.page < last.totalPages ? last.page + 1 : undefined),
    });
}
export function useHasActivities() {
    const { context, enabled } = useListContext();
    return useQuery({
        queryKey: ['local-activities', context.churchId, context.userId, 'exists'],
        enabled,
        queryFn: () => hasActivities(context),
    });
}
export function useActivityCalendar(
    query: TaskFilters,
    today: string,
    active: boolean,
    window?: DateRange,
) {
    const { context, enabled } = useListContext();
    return useQuery({
        queryKey: [
            'local-activities',
            context.churchId,
            context.userId,
            'calendar',
            query,
            today,
            window,
        ],
        enabled: enabled && active,
        queryFn: () => calendarActivities(context, query, today, window),
    });
}
export function useActivityAction() {
    const { context, enabled } = useListContext(),
        client = useQueryClient();
    return useMutation({
        mutationFn: async ({ item, status }: { item: ActivityItem; status?: TaskStatus }) => {
            if (!enabled) throw new Error('not-found');
            const id = activityId(item),
                task = activityKind(item) === 'task';
            if (status) {
                if (task) await setTaskStatus(context, id, item.date, status);
                else if (status !== 'en_progreso')
                    await setHabitStatus(context, id, item.date, status);
                else throw new Error('invalid-habit-status');
            } else await (task ? deleteTask : deleteHabit)(context, id);
        },
        onSuccess: async () => {
            for (const prefix of ['local-activities', 'local-tasks', 'local-habits', 'dashboard'])
                await client.invalidateQueries({
                    queryKey: [prefix, context.churchId, context.userId],
                });
        },
    });
}
