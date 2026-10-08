import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { listWorkflows } from '@/data/repos/workflows-repo';
import type { TasksContext } from '@/data/repos/tasks-context';
import { tasksKey } from './use-tasks';
import { useListContext } from './use-lists';

export const workflowsKey = (scope: TasksContext) =>
    ['local-workflows', scope.churchId, scope.userId] as const;

/** Los flujos de trabajo de la cuenta en la iglesia activa, con su recuento (Fase 7b). */
export function useWorkflows() {
    const { context, enabled } = useListContext();
    return useQuery({
        queryKey: workflowsKey(context),
        enabled,
        queryFn: () => listWorkflows(context),
    });
}

/** Cambiar un flujo cambia lo que enseñan las tareas: se invalida también todo lo de tareas. */
export function useWorkflowMutation<T, R>(
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
                [
                    workflowsKey(context),
                    tasksKey(context),
                    ['local-activities', context.churchId, context.userId],
                ].map((queryKey) => client.invalidateQueries({ queryKey })),
            );
        },
    });
}
