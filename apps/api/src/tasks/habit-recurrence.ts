import { daysBetween, type IsoDate } from '@navis/shared';

import { monthsBetween } from './task-recurrence';
import type { Habit } from './habit.entity';

/**
 * Si un hábito propone una ocurrencia ese día (RFC 0018 §5.3, D3).
 *
 * Repetición simple (Alcance): sin intervalo ni condición de fin, al revés
 * que la tarea (`taskAppliesOn`).
 */
export function habitAppliesOn(habit: Pick<Habit, 'date' | 'repeatFreq'>, date: IsoDate): boolean {
  if (date < habit.date) return false;

  switch (habit.repeatFreq) {
    case 'ninguna':
      return date === habit.date;
    case 'diaria':
      return true;
    case 'semanal':
      return daysBetween(habit.date, date) % 7 === 0;
    case 'mensual':
      return Number(date.slice(8, 10)) === Number(habit.date.slice(8, 10));
  }
}
