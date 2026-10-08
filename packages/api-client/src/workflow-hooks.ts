import type { CreateWorkflowInput, UpdateWorkflowInput, WorkflowWithCount } from '@navis/shared';
import { useMutation, useQuery, useQueryClient, type UseQueryResult } from '@tanstack/react-query';

import type { ApiClient } from './client';
import { queryKeys } from './query-keys';

/** Los flujos de trabajo de la cuenta, con cuántas tareas lleva cada uno (Fase 7b). */
export function useWorkflows(api: ApiClient, enabled = true): UseQueryResult<WorkflowWithCount[]> {
    return useQuery({
        queryKey: queryKeys.tasks.workflows,
        queryFn: () => api.get<WorkflowWithCount[]>('/workflows'),
        enabled,
        staleTime: 30_000,
    });
}

/** Cambiar un flujo mueve también las tareas que lo muestran: se invalida todo lo de tareas. */
function refresh(client: ReturnType<typeof useQueryClient>) {
    return client.invalidateQueries({ queryKey: queryKeys.tasks.all });
}

export function useCreateWorkflow(api: ApiClient) {
    const client = useQueryClient();
    return useMutation({
        mutationFn: (input: CreateWorkflowInput) =>
            api.post<WorkflowWithCount>('/workflows', { ...input }),
        onSuccess: () => refresh(client),
    });
}

export function useUpdateWorkflow(api: ApiClient) {
    const client = useQueryClient();
    return useMutation({
        mutationFn: ({ id, ...input }: UpdateWorkflowInput & { id: string }) =>
            api.patch<WorkflowWithCount>(`/workflows/${id}`, { ...input }),
        onSuccess: () => refresh(client),
    });
}

export function useDeleteWorkflow(api: ApiClient) {
    const client = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => api.delete<void>(`/workflows/${id}`),
        onSuccess: () => refresh(client),
    });
}
