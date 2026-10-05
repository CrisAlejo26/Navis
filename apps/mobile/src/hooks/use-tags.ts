import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { listTaskTags } from '@/data/repos/tags-repo';
import type { TasksContext } from '@/data/repos/tasks-context';
import { tasksKey } from './use-tasks';
import { habitsKey } from './use-habits';
import { useListContext } from './use-lists';

export const taskTagsKey = (scope: TasksContext) =>
    ['local-task-tags', scope.churchId, scope.userId] as const;
export function useTaskTags() {
    const { context, enabled } = useListContext();
    return useQuery({
        queryKey: taskTagsKey(context),
        enabled,
        queryFn: () => listTaskTags(context),
    });
}
export function useTaskTagMutation<T, R>(
    operation: (context: TasksContext, input: T) => Promise<R>,
) {
    const { context, enabled } = useListContext(),
        client = useQueryClient();
    return useMutation({
        mutationFn: (input: T) => {
            if (!enabled) throw new Error('not-found');
            return operation(context, input);
        },
        onSuccess: async () => {
            await Promise.all(
                [taskTagsKey(context), tasksKey(context), habitsKey(context)].map((queryKey) =>
                    client.invalidateQueries({ queryKey }),
                ),
            );
        },
    });
}
