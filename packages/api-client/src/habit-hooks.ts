import type { Habit, HabitOccurrence, HabitsQuery, HabitStats, Paginated } from '@navis/shared';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import type { ApiClient } from './client';
import { queryKeys } from './query-keys';

/** Igual que `toTaskSearch`, para hábitos. */
export function toHabitSearch(query: HabitsQuery): string {
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

function keyOf(query: HabitsQuery): object {
  return { ...query, tag: [...(query.tag ?? [])].sort().join(',') };
}

export function useHabits(
  api: ApiClient,
  query: HabitsQuery,
  enabled = true,
): UseQueryResult<Paginated<HabitOccurrence>> {
  return useQuery({
    queryKey: queryKeys.tasks.habitsList(keyOf(query)),
    queryFn: () => api.get<Paginated<HabitOccurrence>>(`/habits?${toHabitSearch(query)}`),
    enabled,
    staleTime: 15_000,
    placeholderData: (previous) => previous,
  });
}

export function useHabitStats(
  api: ApiClient,
  range: { from: string; to: string },
  enabled = true,
): UseQueryResult<HabitStats> {
  return useQuery({
    queryKey: queryKeys.tasks.habitsStats(range),
    queryFn: () => api.get<HabitStats>(`/habits/stats?from=${range.from}&to=${range.to}`),
    enabled,
    staleTime: 30_000,
  });
}

export function useHabit(api: ApiClient, id: string, enabled = true): UseQueryResult<Habit> {
  return useQuery({
    queryKey: queryKeys.tasks.habitOne(id),
    queryFn: () => api.get<Habit>(`/habits/${id}`),
    enabled: enabled && Boolean(id),
    staleTime: 15_000,
  });
}
