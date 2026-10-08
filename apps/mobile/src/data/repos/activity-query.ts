import {
    daysBetween,
    isoDateSchema,
    MAX_TASKS_RANGE_DAYS,
    type TasksQuery,
    type TaskOccurrence,
    type HabitOccurrence,
    type Paginated,
    type TaskStatus,
    type TaskPriority,
} from '@navis/shared';

export interface ActivityQuery extends TasksQuery {
    statuses?: readonly TaskStatus[];
    priorities?: readonly TaskPriority[];
    recurring?: 'with' | 'without';
}
export function checkActivityRange(from: string, to: string, max = MAX_TASKS_RANGE_DAYS): void {
    isoDateSchema.parse(from);
    isoDateSchema.parse(to);
    const days = daysBetween(from, to);
    if (days < 0 || days > max) throw new Error('invalid-range');
}
export function matchingActivities<T extends TaskOccurrence | HabitOccurrence>(
    items: T[],
    query: ActivityQuery,
): T[] {
    const search = fold(query.search?.trim() ?? '');
    const filtered = items.filter((item) => {
        if ((query.hideCompleted ?? true) && item.status === 'completada') return false;
        if (search && !fold(`${item.title} ${item.description ?? ''}`).includes(search))
            return false;
        if (query.tag?.length && !item.tags.some((tag) => query.tag?.includes(tag.id)))
            return false;
        if (query.statuses?.length && !query.statuses.includes(item.status)) return false;
        if (
            'priority' in item &&
            query.priorities?.length &&
            !query.priorities.includes(item.priority)
        )
            return false;
        if (query.reminder === 'with' && !item.reminder?.enabled) return false;
        if (query.reminder === 'without' && item.reminder?.enabled) return false;
        if (query.recurring === 'with' && !item.isRecurring) return false;
        if (query.recurring === 'without' && item.isRecurring) return false;
        return true;
    });
    const weight = { alta: 0, media: 1, baja: 2 };
    filtered.sort((a, b) => {
        if (query.sort === 'manual')
            return (
                ('manualOrder' in a ? (a.manualOrder ?? Infinity) : Infinity) -
                    ('manualOrder' in b ? (b.manualOrder ?? Infinity) : Infinity) || compare(a, b)
            );
        if (query.sort === 'alphabetical') return a.title.localeCompare(b.title) || compare(a, b);
        if (query.sort === 'recent') return b.createdAt.localeCompare(a.createdAt) || compare(a, b);
        if (query.sort === 'priority' && 'priority' in a && 'priority' in b)
            return weight[a.priority] - weight[b.priority] || compare(a, b);
        return query.sort === 'farthest' ? compare(b, a) : compare(a, b);
    });
    return filtered;
}
export function activityPage<T extends TaskOccurrence | HabitOccurrence>(
    items: T[],
    query: ActivityQuery,
): Paginated<T> {
    const filtered = matchingActivities(items, query);
    const page = Math.max(1, Math.floor(query.page ?? 1)),
        limit = Math.min(100, Math.max(1, Math.floor(query.limit ?? 20)));
    if (!Number.isFinite(page) || !Number.isFinite(limit)) throw new Error('invalid-page');
    return {
        items: filtered.slice((page - 1) * limit, page * limit),
        total: filtered.length,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(filtered.length / limit)),
    };
}
function fold(value: string): string {
    return value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();
}
export function compare(
    a: TaskOccurrence | HabitOccurrence,
    b: TaskOccurrence | HabitOccurrence,
): number {
    const id = (item: TaskOccurrence | HabitOccurrence) =>
        'taskId' in item ? item.taskId : item.habitId;
    return (
        a.date.localeCompare(b.date) ||
        (a.time === b.time
            ? 0
            : a.time === null
              ? 1
              : b.time === null
                ? -1
                : a.time.localeCompare(b.time)) ||
        a.title.localeCompare(b.title) ||
        id(a).localeCompare(id(b))
    );
}
