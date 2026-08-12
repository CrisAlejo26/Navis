import type {
  Paginated,
  Tag,
  Task,
  TaskOccurrence,
  TaskStats,
  TasksQuery,
  TaskStreak,
} from '@navis/shared';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import type { ApiClient } from './client';
import { queryKeys } from './query-keys';

/** `?from=&to=&search=&tag=…`. Lo vacío no viaja. */
export function toTaskSearch(query: TasksQuery): string {
  const params = new URLSearchParams();

  if (query.from) params.set('from', query.from);
  if (query.to) params.set('to', query.to);
  if (query.page && query.page > 1) params.set('page', String(query.page));
  if (query.limit) params.set('limit', String(query.limit));
  if (query.search) params.set('search', query.search);
  for (const tag of query.tag ?? []) params.append('tag', tag);
  if (query.reminder) params.set('reminder', query.reminder);
  if (query.hideCompleted !== undefined) params.set('hideCompleted', String(query.hideCompleted));
  if (query.sort) params.set('sort', query.sort);

  return params.toString();
}

function keyOf(query: TasksQuery): object {
  return { ...query, tag: [...(query.tag ?? [])].sort().join(',') };
}

/** Las tareas del rango, expandidas y ya filtradas por el servidor (§8). */
export function useTasks(
  api: ApiClient,
  query: TasksQuery,
  enabled = true,
): UseQueryResult<Paginated<TaskOccurrence>> {
  return useQuery({
    queryKey: queryKeys.tasks.list(keyOf(query)),
    queryFn: () => api.get<Paginated<TaskOccurrence>>(`/tasks?${toTaskSearch(query)}`),
    enabled,
    staleTime: 15_000,
    placeholderData: (previous) => previous,
  });
}

/** Racha actual y más larga (§6). Se invalida al completar o reabrir una tarea. */
export function useTaskStreak(api: ApiClient, enabled = true): UseQueryResult<TaskStreak> {
  return useQuery({
    queryKey: queryKeys.tasks.streak,
    queryFn: () => api.get<TaskStreak>('/tasks/streak'),
    enabled,
    staleTime: 15_000,
  });
}

/** Las series de «Estadísticas» (§9.4). */
export function useTaskStats(
  api: ApiClient,
  range: { from: string; to: string },
  enabled = true,
): UseQueryResult<TaskStats> {
  return useQuery({
    queryKey: queryKeys.tasks.stats(range),
    queryFn: () => api.get<TaskStats>(`/tasks/stats?from=${range.from}&to=${range.to}`),
    enabled,
    staleTime: 30_000,
  });
}

/** La plantilla entera de una tarea, para el formulario de edición (§9.6). */
export function useTask(api: ApiClient, id: string, enabled = true): UseQueryResult<Task> {
  return useQuery({
    queryKey: queryKeys.tasks.one(id),
    queryFn: () => api.get<Task>(`/tasks/${id}`),
    enabled: enabled && Boolean(id),
    staleTime: 15_000,
  });
}

/** El vocabulario de etiquetas de la cuenta (D12). */
export function useTags(api: ApiClient, enabled = true): UseQueryResult<Tag[]> {
  return useQuery({
    queryKey: queryKeys.tasks.tags,
    queryFn: () => api.get<Tag[]>('/tags'),
    enabled,
    staleTime: 300_000,
  });
}
