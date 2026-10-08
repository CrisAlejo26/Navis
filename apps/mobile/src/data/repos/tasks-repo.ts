import {
    createTaskSchema,
    updateTaskSchema,
    type CreateTaskInput,
    type UpdateTaskInput,
    type Task,
} from '@navis/shared';
import { newId } from '../db';
import { tasksDb, type TasksContext } from './tasks-context';
import { taskRecords } from './task-records';
import { saveActivity, deleteActivity, type ActivityFields } from './activity-writes';
import type { ActivityState } from './activity-status-write';

export { taskRange, listTasks, taskStreak } from './tasks-reads';
export { setTaskStatus } from './activity-status';
export type { TasksContext } from './tasks-context';

export async function findTask(context: TasksContext, id: string): Promise<Task | null> {
    return (await taskRecords(await tasksDb(context), context, { id }))[0] ?? null;
}
export async function createTask(
    context: TasksContext,
    input: CreateTaskInput,
    state?: ActivityState,
): Promise<string> {
    const data = createTaskSchema.parse(input),
        id = newId();
    await saveActivity(context, 'task', id, fields(data), data, true, state);
    return id;
}
export async function updateTask(
    context: TasksContext,
    id: string,
    input: UpdateTaskInput,
    state?: ActivityState,
): Promise<void> {
    const patch = updateTaskSchema.parse(input),
        previous = await findTask(context, id);
    if (!previous) throw new Error('not-found');
    const merged = createTaskSchema.parse({
        ...previous,
        ...patch,
        description:
            patch.description === null
                ? undefined
                : (patch.description ?? previous.description ?? undefined),
        repeatFreq:
            patch.repeatFreq === null
                ? undefined
                : (patch.repeatFreq ?? previous.repeatFreq ?? undefined),
        repeatEndType:
            patch.repeatEndType === null
                ? undefined
                : (patch.repeatEndType ?? previous.repeatEndType ?? undefined),
        repeatEndDate:
            patch.repeatEndDate === null
                ? undefined
                : (patch.repeatEndDate ?? previous.repeatEndDate ?? undefined),
        repeatEndCount:
            patch.repeatEndCount === null
                ? undefined
                : (patch.repeatEndCount ?? previous.repeatEndCount ?? undefined),
        // Una serie no tiene límite (como en la API): convertirla lo borra.
        ...((patch.isRecurring ?? previous.isRecurring)
            ? { dueDate: null, inProgressDeadline: null }
            : {}),
        workflowId:
            patch.workflowId === undefined ? (previous.workflow?.id ?? null) : patch.workflowId,
        reminderAt: undefined,
    });
    const values = fields(merged);
    values.status = merged.isRecurring ? null : (previous.status ?? 'pendiente');
    values.completed_at = merged.isRecurring ? null : previous.completedAt;
    await saveActivity(context, 'task', id, values, patch, false, state);
}
export async function deleteTask(context: TasksContext, id: string): Promise<void> {
    await deleteActivity(context, 'task', id);
}
function fields(data: CreateTaskInput): ActivityFields {
    return {
        title: data.title,
        description: data.description ?? null,
        date: data.date,
        time: data.time ?? null,
        priority: data.priority,
        is_recurring: Number(data.isRecurring),
        status: data.isRecurring ? null : 'pendiente',
        completed_at: null,
        repeat_freq: data.isRecurring ? (data.repeatFreq ?? null) : null,
        repeat_interval: data.repeatInterval,
        repeat_end_type: data.isRecurring ? (data.repeatEndType ?? 'nunca') : null,
        repeat_end_date: data.repeatEndDate ?? null,
        repeat_end_count: data.repeatEndCount ?? null,
        repeat_options:
            data.isRecurring && data.repeatOptions ? JSON.stringify(data.repeatOptions) : null,
        due_date: data.isRecurring ? null : (data.dueDate ?? null),
        in_progress_deadline: data.isRecurring ? null : (data.inProgressDeadline ?? null),
        workflow_id: data.workflowId ?? null,
    };
}
