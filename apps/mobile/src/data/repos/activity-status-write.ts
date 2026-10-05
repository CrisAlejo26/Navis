import {
    taskAppliesOn,
    habitAppliesOn,
    setOccurrenceStatusSchema,
    setHabitOccurrenceStatusSchema,
    isoDateSchema,
    type TaskStatus,
} from '@navis/shared';
import { newId, nowIso, type LocalDb } from '../db';
import { requireActivity, type ActivityKind, type TasksContext } from './tasks-context';
import { taskRecords, habitRecords } from './task-records';
import { activityOccurrences } from './activity-occurrences';

export interface ActivityState {
    date: string;
    status: TaskStatus;
}

/** Also used inside editor transactions, so data and initial state save together. */
export async function writeActivityStatus(
    tx: LocalDb,
    context: TasksContext,
    kind: ActivityKind,
    id: string,
    state: ActivityState,
): Promise<void> {
    const { date, status } = state;
    isoDateSchema.parse(date);
    (kind === 'task' ? setOccurrenceStatusSchema : setHabitOccurrenceStatusSchema).parse({
        status,
    });
    await requireActivity(tx, context, kind, id);
    const task = kind === 'task' ? (await taskRecords(tx, context, { id }))[0] : null;
    const habit = kind === 'habit' ? (await habitRecords(tx, context, { id }))[0] : null;
    if (!(task ? taskAppliesOn(task, date) : habit && habitAppliesOn(habit, date)))
        throw new Error('invalid-occurrence');
    const recurring = Boolean(task?.isRecurring || (habit && habit.repeatFreq !== 'ninguna'));
    const previous = recurring
        ? (await activityOccurrences(tx, context, kind, date, date)).get(`${id}:${date}`)
        : (task ?? habit);
    const completedAt =
        status === 'completada'
            ? previous?.status === 'completada'
                ? (previous.completedAt ?? nowIso())
                : nowIso()
            : null;
    if (recurring) {
        await tx.runAsync(
            `INSERT INTO ${kind}_occurrences
            (id, created_at, updated_at, deleted_at, ${kind}_id, date, status, completed_at)
            SELECT ?, ?, ?, NULL, p.id, ?, ?, ? FROM ${kind}s p
            WHERE p.id = ? AND p.church_id = ? AND p.owner_id = ? AND p.deleted_at IS NULL
            ON CONFLICT(${kind}_id, date) DO UPDATE SET status = excluded.status,
            completed_at = excluded.completed_at, updated_at = excluded.updated_at, deleted_at = NULL`,
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
    } else
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
