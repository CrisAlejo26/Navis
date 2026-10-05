import { taskRange } from './tasks-reads';
import { habitRange } from './habits-reads';
import { activityPage, matchingActivities } from './activity-query';
import { tasksDb, type TasksContext } from './tasks-context';
import {
    activityId,
    activityKind,
    filterRange,
    type TaskFilters,
    type ActivityItem,
} from '@/lib/tasks/filters';
import type { DateRange } from '@/lib/ui/date-grid';

export async function readActivities(
    context: TasksContext,
    query: TaskFilters,
    today: string,
    window?: DateRange,
) {
    let { from, to } = window ?? filterRange(query, today);
    if (window) {
        if (query.from && query.from > from) from = query.from;
        if (query.to && query.to < to) to = query.to;
        if (from > to) return [];
    }
    const tasks = query.type === 'habit' ? [] : await taskRange(context, from, to);
    const habits = query.type === 'task' ? [] : await habitRange(context, from, to);
    const db = await tasksDb(context);
    // Range readers retain deleted history for statistics; the agenda only offers active items.
    const active = await db.getAllAsync<{ key: string }>(
        `SELECT 'task:' || id AS key FROM tasks WHERE church_id = ? AND owner_id = ? AND deleted_at IS NULL
         UNION ALL SELECT 'habit:' || id AS key FROM habits WHERE church_id = ? AND owner_id = ? AND deleted_at IS NULL`,
        context.churchId,
        context.userId,
        context.churchId,
        context.userId,
    );
    const keys = new Set(active.map((row) => row.key));
    return ([...tasks, ...habits] as ActivityItem[]).filter((item) =>
        keys.has(`${activityKind(item)}:${activityId(item)}`),
    );
}
export async function calendarActivities(
    context: TasksContext,
    query: TaskFilters,
    today: string,
    window?: DateRange,
) {
    return matchingActivities(await readActivities(context, query, today, window), {
        ...query,
        hideCompleted: false,
    });
}
export async function listActivities(
    context: TasksContext,
    query: TaskFilters,
    today: string,
    window?: DateRange,
) {
    const items = await readActivities(context, query, today, window);
    const matched = matchingActivities(items, { ...query, hideCompleted: false });
    const done = matched.filter((item) => item.status === 'completada').length;
    return { ...activityPage(items, query), done, pending: matched.length - done };
}
export async function hasActivities(context: TasksContext): Promise<boolean> {
    const db = await tasksDb(context);
    const row = await db.getFirstAsync<{ total: number }>(
        `SELECT (SELECT COUNT(*) FROM tasks WHERE church_id = ? AND owner_id = ? AND deleted_at IS NULL)
        + (SELECT COUNT(*) FROM habits WHERE church_id = ? AND owner_id = ? AND deleted_at IS NULL) AS total`,
        context.churchId,
        context.userId,
        context.churchId,
        context.userId,
    );
    return Boolean(row?.total);
}
