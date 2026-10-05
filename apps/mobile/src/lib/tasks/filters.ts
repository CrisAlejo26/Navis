import {
    addDays,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    type TaskOccurrence,
    type HabitOccurrence,
} from '@navis/shared';
import type { ActivityQuery } from '@/data/repos/activity-query';

export type ActivityItem = TaskOccurrence | HabitOccurrence;
export type TaskGroup = 'date' | 'status' | 'priority' | 'tag' | 'none';
export interface TaskFilters extends ActivityQuery {
    type: 'both' | 'task' | 'habit';
    group: TaskGroup;
}
export const defaultFilters = (): TaskFilters => ({
    type: 'both',
    group: 'date',
    hideCompleted: true,
    sort: 'nearest',
});
export const activityId = (item: ActivityItem) => ('taskId' in item ? item.taskId : item.habitId);
export const activityKind = (item: ActivityItem) =>
    'taskId' in item ? ('task' as const) : ('habit' as const);
export const activityKey = (item: ActivityItem) =>
    `${activityKind(item)}:${activityId(item)}:${item.date}`;
export function filterRange(filters: TaskFilters, today: string) {
    return { from: filters.from ?? addDays(today, -30), to: filters.to ?? addDays(today, 30) };
}
export function filterCount(f: TaskFilters): number {
    return (
        Number(f.type !== 'both') +
        Number(Boolean(f.search?.trim())) +
        Number(Boolean(f.from || f.to)) +
        (f.statuses?.length ?? 0) +
        (f.priorities?.length ?? 0) +
        (f.tag?.length ?? 0) +
        Number(Boolean(f.reminder)) +
        Number(Boolean(f.recurring)) +
        Number(f.hideCompleted === false)
    );
}
export function quickRange(
    value: 'today' | 'tomorrow' | 'week' | 'month' | 'overdue',
    today: string,
) {
    if (value === 'today') return { from: today, to: today };
    if (value === 'tomorrow') return { from: addDays(today, 1), to: addDays(today, 1) };
    if (value === 'week') {
        const from = startOfWeek(today);
        return { from, to: addDays(from, 6) };
    }
    if (value === 'month') return { from: startOfMonth(today), to: endOfMonth(today) };
    return { from: addDays(today, -30), to: addDays(today, -1) };
}
