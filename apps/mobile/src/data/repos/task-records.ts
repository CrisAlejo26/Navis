import type { Task, Habit } from '@navis/shared';
import type { LocalDb } from '../db';
import { readActivityTags } from './task-relations';
import { readActivityReminder } from './task-reminders';
import type { ActivityKind, TasksContext } from './tasks-context';

export interface ActivityMeta {
    createdAt: string;
    deletedAt: string | null;
}
export type TaskRecord = Task & ActivityMeta;
export type HabitRecord = Habit & ActivityMeta;
const common = `id, title, description, date, time, status, completed_at AS completedAt,
    repeat_freq AS repeatFreq, created_at AS createdAt, deleted_at AS deletedAt`;
const projections = {
    task: `${common}, priority, is_recurring AS isRecurring, repeat_interval AS repeatInterval,
        repeat_end_type AS repeatEndType, repeat_end_date AS repeatEndDate, repeat_end_count AS repeatEndCount`,
    habit: `${common}, goal`,
};

export async function taskRecords(
    db: LocalDb,
    context: TasksContext,
    options: {
        id?: string;
        from?: string;
        to?: string;
        limit?: number;
        offset?: number;
        history?: boolean;
    } = {},
): Promise<TaskRecord[]> {
    const rows = await records<TaskRecord>(db, context, 'task', options);
    return rows.map((row) => ({ ...row, isRecurring: Boolean(row.isRecurring) }));
}
export async function habitRecords(
    db: LocalDb,
    context: TasksContext,
    options: Parameters<typeof taskRecords>[2] = {},
): Promise<HabitRecord[]> {
    return records<HabitRecord>(db, context, 'habit', options);
}

async function records<T extends TaskRecord | HabitRecord>(
    db: LocalDb,
    context: TasksContext,
    kind: ActivityKind,
    options: NonNullable<Parameters<typeof taskRecords>[2]>,
): Promise<T[]> {
    const clauses: string[] = [];
    const params: (string | number)[] = [context.churchId, context.userId];
    if (!options.history) clauses.push('deleted_at IS NULL');
    if (options.id) {
        clauses.push('id = ?');
        params.push(options.id);
    }
    if (options.to) {
        clauses.push('date <= ?');
        params.push(options.to);
    }
    if (options.from) {
        clauses.push(
            kind === 'task'
                ? '(is_recurring = 1 OR date >= ?)'
                : "(repeat_freq != 'ninguna' OR date >= ?)",
        );
        params.push(options.from);
    }
    const paging = options.limit === undefined ? '' : ' LIMIT ? OFFSET ?';
    if (options.limit !== undefined) params.push(options.limit, options.offset ?? 0);
    const rows = await db.getAllAsync<T>(
        `SELECT ${projections[kind]} FROM ${kind}s WHERE church_id = ? AND owner_id = ?${clauses.length ? ` AND ${clauses.join(' AND ')}` : ''}
        ORDER BY date, time IS NULL, time, title, id${paging}`,
        ...params,
    );
    for (const row of rows) {
        row.tags = await readActivityTags(db, context, kind, row.id);
        row.reminder = await readActivityReminder(db, context, kind, row.id);
    }
    return rows;
}
