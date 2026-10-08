import {
    addDays,
    closedSeconds,
    summarizeTime,
    type RunningTimer,
    type TaskTime,
    type TaskTimeEntry,
    type TaskTimeSummary,
} from '@navis/shared';
import { newId, nowIso } from '../db';
import { inLocalTransaction } from '../local-transaction';
import { tasksDb, type TasksContext } from './tasks-context';
import { readWorkflowRef } from './workflow-relations';

interface EntryRow {
    id: string;
    taskId: string;
    startedAt: string;
    endedAt: string | null;
}

const COLUMNS = 'id, task_id AS taskId, started_at AS startedAt, ended_at AS endedAt';

/**
 * El cronómetro de las tareas (Fase 7c), copia exacta de la API: una persona
 * tiene un solo cronómetro en marcha por iglesia; empezar otro detiene el
 * anterior; empezar el mismo no hace nada; las entradas de una tarea borrada
 * se conservan.
 */
export async function runningTimer(context: TasksContext): Promise<RunningTimer | null> {
    const db = await tasksDb(context);
    const entry = await db.getFirstAsync<EntryRow>(
        `SELECT ${COLUMNS} FROM task_time_entries
         WHERE church_id = ? AND owner_id = ? AND deleted_at IS NULL AND ended_at IS NULL
         ORDER BY started_at DESC LIMIT 1`,
        context.churchId,
        context.userId,
    );
    if (!entry) return null;
    const task = await db.getFirstAsync<{ title: string }>(
        'SELECT title FROM tasks WHERE id = ? AND church_id = ? AND owner_id = ?',
        entry.taskId,
        context.churchId,
        context.userId,
    );
    return { entry, task: { id: entry.taskId, title: task?.title ?? '' } };
}

export async function startTimer(
    context: TasksContext,
    taskId: string,
    now = new Date(),
): Promise<RunningTimer> {
    const db = await tasksDb(context);
    let started: RunningTimer | undefined;
    await inLocalTransaction(db, async (tx) => {
        const task = await tx.getFirstAsync<{ title: string }>(
            'SELECT title FROM tasks WHERE id = ? AND church_id = ? AND owner_id = ? AND deleted_at IS NULL',
            taskId,
            context.churchId,
            context.userId,
        );
        if (!task) throw new Error('not-found');
        const open = await tx.getAllAsync<EntryRow>(
            `SELECT ${COLUMNS} FROM task_time_entries
             WHERE church_id = ? AND owner_id = ? AND deleted_at IS NULL AND ended_at IS NULL`,
            context.churchId,
            context.userId,
        );
        const same = open.find((entry) => entry.taskId === taskId);
        for (const entry of open) if (entry !== same) await closeEntry(tx, context, entry, now);
        const entry: EntryRow = same ?? {
            id: newId(),
            taskId,
            startedAt: now.toISOString(),
            endedAt: null,
        };
        if (!same)
            await tx.runAsync(
                `INSERT INTO task_time_entries (id, created_at, updated_at, deleted_at, church_id, owner_id, task_id, started_at, ended_at)
                 VALUES (?, ?, ?, NULL, ?, ?, ?, ?, NULL)`,
                entry.id,
                nowIso(),
                nowIso(),
                context.churchId,
                context.userId,
                taskId,
                entry.startedAt,
            );
        started = { entry, task: { id: taskId, title: task.title } };
    });
    if (!started) throw new Error('not-found');
    return started;
}

export async function stopTimer(context: TasksContext, now = new Date()): Promise<TaskTimeEntry> {
    const db = await tasksDb(context);
    let stopped: EntryRow | undefined;
    await inLocalTransaction(db, async (tx) => {
        const open = await tx.getFirstAsync<EntryRow>(
            `SELECT ${COLUMNS} FROM task_time_entries
             WHERE church_id = ? AND owner_id = ? AND deleted_at IS NULL AND ended_at IS NULL
             ORDER BY started_at DESC LIMIT 1`,
            context.churchId,
            context.userId,
        );
        if (!open) throw new Error('not-found');
        stopped = await closeEntry(tx, context, open, now);
    });
    if (!stopped) throw new Error('not-found');
    return stopped;
}

/** Las entradas de una tarea, las más recientes primero, y el total de las cerradas. */
export async function taskTime(context: TasksContext, taskId: string): Promise<TaskTime> {
    const db = await tasksDb(context);
    const owned = await db.getFirstAsync(
        'SELECT id FROM tasks WHERE id = ? AND church_id = ? AND owner_id = ?',
        taskId,
        context.churchId,
        context.userId,
    );
    if (!owned) throw new Error('not-found');
    const entries = await db.getAllAsync<EntryRow>(
        `SELECT ${COLUMNS} FROM task_time_entries
         WHERE church_id = ? AND owner_id = ? AND task_id = ? AND deleted_at IS NULL
         ORDER BY started_at DESC LIMIT 200`,
        context.churchId,
        context.userId,
        taskId,
    );
    return { entries, totalSeconds: closedSeconds(entries) };
}

export async function deleteTimeEntry(context: TasksContext, id: string): Promise<void> {
    const db = await tasksDb(context);
    await inLocalTransaction(db, async (tx) => {
        const row = await tx.getFirstAsync(
            'SELECT id FROM task_time_entries WHERE id = ? AND church_id = ? AND owner_id = ? AND deleted_at IS NULL',
            id,
            context.churchId,
            context.userId,
        );
        if (!row) throw new Error('not-found');
        await tx.runAsync(
            'UPDATE task_time_entries SET deleted_at = ?, updated_at = ? WHERE id = ? AND church_id = ? AND owner_id = ?',
            nowIso(),
            nowIso(),
            id,
            context.churchId,
            context.userId,
        );
    });
}

/** El tiempo del rango por tarea y por flujo: la misma `summarizeTime` que usa la API. */
export async function timeSummary(
    context: TasksContext,
    from: string,
    to: string,
    timezone: string,
): Promise<TaskTimeSummary> {
    const db = await tasksDb(context);
    const entries = await db.getAllAsync<EntryRow>(
        `SELECT ${COLUMNS} FROM task_time_entries
         WHERE church_id = ? AND owner_id = ? AND deleted_at IS NULL
           AND started_at >= ? AND started_at < ?`,
        context.churchId,
        context.userId,
        `${addDays(from, -1)}T00:00:00.000Z`,
        `${addDays(to, 2)}T00:00:00.000Z`,
    );
    const ids = [...new Set(entries.map((entry) => entry.taskId))];
    const tasks = [];
    for (const id of ids) {
        const row = await db.getFirstAsync<{
            id: string;
            title: string;
            workflowId: string | null;
        }>(
            'SELECT id, title, workflow_id AS workflowId FROM tasks WHERE id = ? AND church_id = ? AND owner_id = ?',
            id,
            context.churchId,
            context.userId,
        );
        if (row)
            tasks.push({
                id: row.id,
                title: row.title,
                workflow: await readWorkflowRef(db, context, row.workflowId),
            });
    }
    return summarizeTime({ entries, tasks, from, to, timezone });
}

async function closeEntry(
    tx: Awaited<ReturnType<typeof tasksDb>>,
    context: TasksContext,
    entry: EntryRow,
    now: Date,
): Promise<EntryRow> {
    // Un reloj que retrocede no puede dejar una entrada que termina antes de empezar.
    const end =
        now.getTime() < new Date(entry.startedAt).getTime() ? entry.startedAt : now.toISOString();
    await tx.runAsync(
        'UPDATE task_time_entries SET ended_at = ?, updated_at = ? WHERE id = ? AND church_id = ? AND owner_id = ?',
        end,
        nowIso(),
        entry.id,
        context.churchId,
        context.userId,
    );
    return { ...entry, endedAt: end };
}
