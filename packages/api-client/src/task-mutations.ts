import type {
  CreateTagInput,
  CreateTaskInput,
  Tag,
  Task,
  TaskStatus,
  UpdateTagInput,
  UpdateTaskInput,
} from '@navis/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { ApiClient } from './client';
import { queryKeys } from './query-keys';

/**
 * Todo lo de tareas se invalida junto: completar una mueve su fila, la
 * racha y las cuentas de la portada a la vez.
 */
function refresh(client: ReturnType<typeof useQueryClient>) {
  return client.invalidateQueries({ queryKey: queryKeys.tasks.all });
}

export function useCreateTask(api: ApiClient) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateTaskInput) => api.post<Task>('/tasks', { ...input }),
    onSuccess: () => refresh(client),
  });
}

export function useUpdateTask(api: ApiClient) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: UpdateTaskInput & { id: string }) =>
      api.patch<Task>(`/tasks/${id}`, { ...input }),
    onSuccess: () => refresh(client),
  });
}

export function useDeleteTask(api: ApiClient) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<void>(`/tasks/${id}`),
    onSuccess: () => refresh(client),
  });
}

/** Cambia el estado de un día concreto; materializa si hace falta (D3). */
export function useSetTaskOccurrence(api: ApiClient) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, date, status }: { taskId: string; date: string; status: TaskStatus }) =>
      api.put<void>(`/tasks/${taskId}/occurrences/${date}`, { status }),
    onSuccess: () => refresh(client),
  });
}

export function useCreateTag(api: ApiClient) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateTagInput) => api.post<Tag>('/tags', { ...input }),
    onSuccess: () => refresh(client),
  });
}

export function useUpdateTag(api: ApiClient) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: UpdateTagInput & { id: string }) =>
      api.patch<Tag>(`/tags/${id}`, { ...input }),
    onSuccess: () => refresh(client),
  });
}

export function useDeleteTag(api: ApiClient) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<void>(`/tags/${id}`),
    onSuccess: () => refresh(client),
  });
}
