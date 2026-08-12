/**
 * El tramo más largo que se puede pedir de una vez (§8.2): igual que el
 * calendario (RFC 0002), y por la misma razón — sin tope, una tarea diaria
 * sin fin se expandiría al infinito.
 */
export const MAX_TASKS_RANGE_DAYS = 92;

/** Cuántos días hacia atrás mira el cálculo de la racha, como mucho (§6.2). */
export const STREAK_LOOKBACK_DAYS = 400;

/** Los últimos días de la tira del Faro, en «Hoy» (§9.3, D19). */
export const STREAK_STRIP_DAYS = 14;

/** Los últimos días de la tira a escala, en «Estadísticas» (§9.4). */
export const STREAK_STATS_DAYS = 90;

import type { TaskPriority } from './tasks';

/** Por qué campo ordena el listado de tareas (§9.5). */
export const TASK_SORTS = ['nearest', 'farthest', 'priority', 'recent', 'alphabetical'] as const;

export type TaskSort = (typeof TASK_SORTS)[number];

export const DEFAULT_TASK_SORT: TaskSort = 'nearest';

export function isTaskSort(value: string): value is TaskSort {
  return (TASK_SORTS as readonly string[]).includes(value);
}

/**
 * Lo que acepta `GET /tasks` (§8, §8.1): el tramo se expande (D3, tope de 92
 * días como el calendario) y después se filtra, se ordena y se pagina.
 *
 * `hideCompleted` empieza en `true` (D21). Sin `from`/`to`, el servidor
 * propone hoy más 30 días.
 */
export interface TasksQuery {
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
  /** Contra el título y la descripción, sin acentos. */
  search?: string;
  /** Repetible: varias etiquetas suman. */
  tag?: readonly string[];
  reminder?: 'with' | 'without';
  hideCompleted?: boolean;
  sort?: TaskSort;
}

/** Una semana del gráfico de barras apiladas (§9.4). */
export interface TaskStatsWeek {
  /** El lunes de esa semana. */
  week: string;
  completed: number;
  pending: number;
}

export interface TaskStatsByPriority {
  priority: TaskPriority;
  count: number;
}

export interface TaskStatsByTag {
  tagId: string;
  name: string;
  icon: string;
  accent: string;
  count: number;
}

/** Un día de los últimos noventa, para la tira del Faro a escala. */
export interface TaskStreakDay {
  date: string;
  completed: boolean;
  /** Sin ninguna tarea prevista: no cuenta ni a favor ni en contra (D8). */
  empty: boolean;
}

/** Las cuentas de «Estadísticas» (§9.4). */
export interface TaskStats {
  byWeek: TaskStatsWeek[];
  byPriority: TaskStatsByPriority[];
  byTag: TaskStatsByTag[];
  /** Tasa de cumplimiento semanal, para la línea de tendencia. */
  trend: { week: string; rate: number }[];
  streak90: TaskStreakDay[];
  currentStreak: number;
  longestStreak: number;
}
