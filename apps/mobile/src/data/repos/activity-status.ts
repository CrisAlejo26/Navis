import {
    taskAppliesOn,
    habitAppliesOn,
    setOccurrenceStatusSchema,
    setHabitOccurrenceStatusSchema,
    isoDateSchema,
    type TaskStatus,
    type HabitStatus,
} from '@navis/shared';
import { newId, nowIso } from '../db';
import { inLocalTransaction } from '../local-transaction';
import { tasksDb, requireActivity, type TasksContext, type ActivityKind } from './tasks-context';
import { taskRecords, habitRecords } from './task-records';

export async function setTaskStatus(
    context: TasksContext,
    id: string,
    date: string,
    status: TaskStatus,
): Promise<void> {
    setOccurrenceStatusSchema.parse({ status });
    await setStatus(context, 'task', id, isoDateSchema.parse(date), status);
}
export async function setHabitStatus(
    context: TasksContext,
    id: string,
    date: string,
    status: HabitStatus,
): Promise<void> {
    setHabitOccurrenceStatusSchema.parse({ status });
    await setStatus(context, 'habit', id, isoDateSchema.parse(date), status);
}
async function setStatus(
    context: TasksContext,
    kind: ActivityKind,
    id: string,
    date: string,
    status: TaskStatus,
): Promise<void> {
    const db = await tasksDb(context);
    await inLocalTransaction(db, async (tx) => {
        await requireActivity(tx, context, kind, id);
        const task = kind === 'task' ? (await taskRecords(tx, context, { id }))[0] : null;
        const habit = kind === 'habit' ? (await habitRecords(tx, context, { id }))[0] : null;
        if (!(task ? taskAppliesOn(task, date) : habit && habitAppliesOn(habit, date)))
            throw new Error('invalid-occurrence');
        const completedAt = status === 'completada' ? nowIso() : null;
        if (task?.isRecurring || (habit && habit.repeatFreq !== 'ninguna')) {
            await tx.runAsync(
                `INSERT INTO ${kind}_occurrences
                (id, created_at, updated_at, deleted_at, ${kind}_id, date, status, completed_at)
                SELECT ?, ?, ?, NULL, p.id, ?, ?, ? FROM ${kind}s p
                WHERE p.id = ? AND p.church_id = ? AND p.owner_id = ? AND p.deleted_at IS NULL
                ON CONFLICT(${kind}_id, date)
                DO UPDATE SET status = excluded.status, completed_at = excluded.completed_at, updated_at = excluded.updated_at, deleted_at = NULL`,
                newId(),
                nowIso(),
                nowIso(),
                date,
                status,
                completedAt,
                id,
                context.churchId,
                context.userId,
            );
        } else {
            await tx.runAsync(
                `UPDATE ${kind}s SET status = ?, completed_at = ?, updated_at = ?
                WHERE id = ? AND church_id = ? AND owner_id = ? AND deleted_at IS NULL`,
                status,
                completedAt,
                nowIso(),
                id,
                context.churchId,
                context.userId,
            );
        }
    });
}
