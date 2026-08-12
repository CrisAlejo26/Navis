/** Por qué campo ordena el listado de hábitos (§9.5). Sin `priority`: los hábitos no tienen. */
export const HABIT_SORTS = ['nearest', 'farthest', 'recent', 'alphabetical'] as const;

export type HabitSort = (typeof HABIT_SORTS)[number];

export const DEFAULT_HABIT_SORT: HabitSort = 'nearest';

export function isHabitSort(value: string): value is HabitSort {
  return (HABIT_SORTS as readonly string[]).includes(value);
}

/** Igual que `TasksQuery`, sobre `GET /habits` (§8). */
export interface HabitsQuery {
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
  search?: string;
  tag?: readonly string[];
  reminder?: 'with' | 'without';
  hideCompleted?: boolean;
  sort?: HabitSort;
}

export interface HabitStatsWeek {
  week: string;
  completed: number;
  pending: number;
}

export interface HabitStatsByTag {
  tagId: string;
  name: string;
  icon: string;
  accent: string;
  count: number;
}

/** Las cuentas de cumplimiento de hábitos (§9.4). Sin racha: es solo de tareas (D19). */
export interface HabitStats {
  byWeek: HabitStatsWeek[];
  byTag: HabitStatsByTag[];
  trend: { week: string; rate: number }[];
}
