import type { HabitStatus, TaskPriority, TaskStatus } from '@navis/shared';

/**
 * Color y clave de traducción de cada prioridad y estado (RFC 0018 §9.3).
 *
 * El color nunca informa solo: la palabra va siempre escrita al lado (Regla 3
 * §7), así que estos mapas solo deciden el acento, no sustituyen el texto.
 */
export const PRIORITY_ACCENT: Record<TaskPriority, string> = {
  alta: 'destructive',
  media: 'warning',
  baja: 'primary',
};

export const PRIORITY_LABEL_KEY: Record<TaskPriority, string> = {
  baja: 'tasks.priorityLow',
  media: 'tasks.priorityMedium',
  alta: 'tasks.priorityHigh',
};

export const TASK_STATUS_LABEL_KEY: Record<TaskStatus, string> = {
  pendiente: 'tasks.statusPending',
  en_progreso: 'tasks.statusInProgress',
  completada: 'tasks.statusDone',
};

export const HABIT_STATUS_LABEL_KEY: Record<HabitStatus, string> = {
  pendiente: 'tasks.statusPending',
  completada: 'tasks.statusDone',
};

/** Los tramos del día, fijos sobre `time` (D17). */
export function timeSlotOf(time: string | null): 'morning' | 'afternoon' | 'evening' | null {
  if (!time) return null;
  const hour = Number(time.slice(0, 2));
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 19) return 'afternoon';
  return 'evening';
}
