import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Paginated, Task, TaskSeriesActionInput, TaskOrderInput } from '@navis/shared';
import type { ApiClient } from './client';
import { queryKeys } from './query-keys';
export function useTaskTemplates(api: ApiClient, recurring: boolean) {
    return useInfiniteQuery({ queryKey: [...queryKeys.tasks.all, 'templates', recurring], initialPageParam: 1, queryFn: ({ pageParam }) => api.get<Paginated<Task>>(`/tasks/templates?recurring=${recurring}&page=${pageParam}&limit=100`), getNextPageParam: (last) => last.page < last.totalPages ? last.page + 1 : undefined });
}
export function useTaskSeriesAction(api: ApiClient) {
    const client = useQueryClient();
    return useMutation({ mutationFn: ({ id, ...command }: TaskSeriesActionInput & { id: string }) => api.put<void>(`/tasks/${id}/series`, command), onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.tasks.all }) });
}
export function useTaskOrder(api: ApiClient) {
    const client = useQueryClient();
    return useMutation({ mutationFn: (input: TaskOrderInput) => api.put<void>('/tasks/order', input), onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.tasks.all }) });
}
