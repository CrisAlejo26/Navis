import { addDays } from './dates';
import { taskAppliesOn } from './task-recurrence';
import type { Task } from './schemas/tasks';
type Translate = (key: string, options?: Record<string, string | number>) => string;
const keys = { diaria: 'tasks.repeatDaily', semanal: 'tasks.repeatWeekly', mensual: 'tasks.repeatMonthly', fechas: 'tasks.repeatDates' } as const;
export function describeTaskRepeat(task: Task, locale: string, t: Translate): string {
    const options = task.repeatOptions;
    const weekday = (value: number) => new Intl.DateTimeFormat(locale, { weekday: 'short', timeZone: 'UTC' }).format(new Date(Date.UTC(2026, 5, 7 + value)));
    const parts = [t(keys[task.repeatFreq ?? 'diaria'])];
    if (task.repeatFreq !== 'fechas') parts.push(`${task.repeatInterval} ${t(task.repeatFreq === 'mensual' ? 'tasks.repeatIntervalMonths' : task.repeatFreq === 'semanal' ? 'tasks.repeatIntervalWeeks' : 'tasks.repeatIntervalDays')}`);
    if (options?.kind === 'weekdays') parts.push([...options.weekdays].sort((a, b) => (a + 6) % 7 - (b + 6) % 7).map(weekday).join(', '));
    if (options?.kind === 'monthDay') parts.push(String(options.day));
    if (options?.kind === 'monthWeekday') parts.push(`${options.week === -1 ? t('tasks.repeatLastWeek') : options.week} ${weekday(options.weekday)}`);
    if (options?.kind === 'dates') parts.push(options.dates.join(', '));
    if (task.repeatEndType === 'fecha' && task.repeatEndDate) parts.push(`${t('tasks.repeatEndDate')}: ${task.repeatEndDate}`);
    if (task.repeatEndType === 'cantidad') parts.push(`${t('tasks.repeatEndCountLabel')}: ${task.repeatEndCount}`);
    return parts.join(' · ');
}
/** Bounded ten-year preview, independent of the church time zone (ISO days). */
export function nextTaskDate(task: Task, from: string): string | null {
    if (task.repeatPauses?.some((pause) => !pause.to)) return null;
    const start = from < task.date ? task.date : from;
    if (task.repeatOptions?.kind === 'dates') return [...task.repeatOptions.dates].sort().find((date) => date >= start && taskAppliesOn(task, date)) ?? null;
    for (let offset = 0; offset <= 3660; offset++) {
        const date = addDays(start, offset);
        if (taskAppliesOn(task, date)) return date;
        if (task.repeatStoppedAt && date >= task.repeatStoppedAt) break;
        if (task.repeatEndType === 'fecha' && task.repeatEndDate && date > task.repeatEndDate) break;
    }
    return null;
}
