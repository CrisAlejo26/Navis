import { daysBetween, parseIsoDate, type IsoDate } from '@navis/shared';

import type { Task } from './task.entity';

/** Meses de diferencia entre dos días `AAAA-MM-DD`, sin mirar el día del mes. */
export function monthsBetween(from: IsoDate, to: IsoDate): number {
  const a = parseIsoDate(from);
  const b = parseIsoDate(to);
  return (b.getUTCFullYear() - a.getUTCFullYear()) * 12 + (b.getUTCMonth() - a.getUTCMonth());
}

type TaskRepeat = Pick<
  Task,
  | 'date'
  | 'isRecurring'
  | 'repeatFreq'
  | 'repeatInterval'
  | 'repeatEndType'
  | 'repeatEndDate'
  | 'repeatEndCount'
>;

/**
 * Si una tarea propone una ocurrencia ese día (RFC 0018 §5.4, D2, D3).
 *
 * Sin `RRULE`: solo diaria/semanal/mensual con un intervalo, y una condición
 * de fin. Es la misma idea que `appliesOn` del calendario (RFC 0002), con
 * intervalo y fin en vez de «ese día de la semana».
 */
export function taskAppliesOn(task: TaskRepeat, date: IsoDate): boolean {
  if (date < task.date) return false;
  if (!task.isRecurring) return date === task.date;

  const interval = Math.max(1, task.repeatInterval);
  let index: number;

  if (task.repeatFreq === 'mensual') {
    if (Number(date.slice(8, 10)) !== Number(task.date.slice(8, 10))) return false;
    const months = monthsBetween(task.date, date);
    if (months < 0 || months % interval !== 0) return false;
    index = months / interval;
  } else {
    const days = daysBetween(task.date, date);
    const step = task.repeatFreq === 'semanal' ? 7 * interval : interval;
    if (days < 0 || days % step !== 0) return false;
    index = days / step;
  }

  if (task.repeatEndType === 'fecha' && task.repeatEndDate && date > task.repeatEndDate)
    return false;
  if (
    task.repeatEndType === 'cantidad' &&
    task.repeatEndCount != null &&
    index >= task.repeatEndCount
  ) {
    return false;
  }

  return true;
}
