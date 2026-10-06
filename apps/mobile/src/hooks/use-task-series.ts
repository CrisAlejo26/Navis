import { useInfiniteQuery } from '@tanstack/react-query';
import { taskTemplates, actOnTaskSeries, orderTasks } from '@/data/repos/task-series-repo';
import { useListContext } from './use-lists';
import { tasksKey, useTaskMutation } from './use-tasks';
import type { TaskSeriesActionInput } from '@navis/shared';
export function useTaskTemplates(recurring: boolean) {
    const { context, enabled } = useListContext();
    return useInfiniteQuery({ queryKey: [...tasksKey(context), 'templates', recurring], enabled, initialPageParam: 1, queryFn: ({ pageParam }) => taskTemplates(context, recurring, pageParam), getNextPageParam: (last) => last.page < last.totalPages ? last.page + 1 : undefined });
}
export function useTaskSeriesAction() { return useTaskMutation((context, { id, ...command }: TaskSeriesActionInput & { id: string }) => actOnTaskSeries(context, id, command)); }
export function useTaskOrder() { return useTaskMutation(orderTasks); }
