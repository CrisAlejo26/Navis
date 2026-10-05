import {
    addDays,
    eachDay,
    taskAppliesOn,
    currentTaskStreak,
    STREAK_LOOKBACK_DAYS,
    type TaskOccurrence,
    type TaskStreak,
    type Paginated,
} from '@navis/shared';
import { newId, nowIso } from '../db';
import { tasksDb, type TasksContext } from './tasks-context';
import { taskRecords } from './task-records';
import { activityOccurrences } from './activity-occurrences';
import { activityPage, checkActivityRange, compare, type ActivityQuery } from './activity-query';

export async function taskRange(
    context: TasksContext,
    from: string,
    to: string,
): Promise<TaskOccurrence[]> {
    checkActivityRange(from, to);
    return expandTasks(context, from, to);
}
async function expandTasks(
    context: TasksContext,
    from: string,
    to: string,
): Promise<TaskOccurrence[]> {
    const db = await tasksDb(context),
        materialized = await activityOccurrences(db, context, 'task', from, to);
    const result: TaskOccurrence[] = [];
    for (let offset = 0; ; offset += 100) {
        const templates = await taskRecords(db, context, {
            from,
            to,
            history: true,
            limit: 100,
            offset,
        });
        for (const task of templates)
            for (const date of eachDay(from, to)) {
                if (!taskAppliesOn(task, date)) continue;
                const row = task.isRecurring ? materialized.get(`${task.id}:${date}`) : undefined;
                if (task.deletedAt && task.isRecurring && !row) continue;
                result.push({
                    taskId: task.id,
                    date,
                    title: task.title,
                    description: task.description,
                    time: task.time,
                    priority: task.priority,
                    status: task.isRecurring
                        ? (row?.status ?? 'pendiente')
                        : (task.status ?? 'pendiente'),
                    completedAt: task.isRecurring ? (row?.completedAt ?? null) : task.completedAt,
                    isRecurring: task.isRecurring,
                    tags: task.tags,
                    reminder: task.reminder,
                    createdAt: task.createdAt,
                });
            }
        if (templates.length < 100) break;
    }
    return result.sort(compare);
}
export async function listTasks(
    context: TasksContext,
    query: ActivityQuery,
    today: string,
): Promise<Paginated<TaskOccurrence>> {
    const from = query.from ?? today,
        to = query.to ?? addDays(from, 30);
    return activityPage(await taskRange(context, from, to), query);
}
export async function taskStreak(context: TasksContext, today: string): Promise<TaskStreak> {
    const from = addDays(today, -STREAK_LOOKBACK_DAYS);
    checkActivityRange(from, today, STREAK_LOOKBACK_DAYS);
    const current = currentTaskStreak(await expandTasks(context, from, today), today),
        db = await tasksDb(context);
    await db.runAsync(
        `INSERT INTO task_streak_cache (id, created_at, updated_at, deleted_at, church_id, owner_id, longest_streak)
        VALUES (?, ?, ?, NULL, ?, ?, ?) ON CONFLICT(church_id, owner_id) DO UPDATE SET
        longest_streak = MAX(longest_streak, excluded.longest_streak), updated_at = excluded.updated_at`,
        newId(),
        nowIso(),
        nowIso(),
        context.churchId,
        context.userId,
        current,
    );
    const cache = await db.getFirstAsync<{ longest: number }>(
        'SELECT longest_streak AS longest FROM task_streak_cache WHERE church_id = ? AND owner_id = ?',
        context.churchId,
        context.userId,
    );
    return { current, longest: cache?.longest ?? current };
}
