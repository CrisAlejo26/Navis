import {
    createHabitSchema,
    updateHabitSchema,
    type CreateHabitInput,
    type UpdateHabitInput,
    type Habit,
} from '@navis/shared';
import { newId } from '../db';
import { tasksDb, type TasksContext } from './tasks-context';
import { habitRecords } from './task-records';
import { saveActivity, deleteActivity, type ActivityFields } from './activity-writes';
import type { ActivityState } from './activity-status-write';

export { habitRange, listHabits } from './habits-reads';
export { setHabitStatus } from './activity-status';

export async function findHabit(context: TasksContext, id: string): Promise<Habit | null> {
    return (await habitRecords(await tasksDb(context), context, { id }))[0] ?? null;
}
export async function createHabit(
    context: TasksContext,
    input: CreateHabitInput,
    state?: ActivityState,
): Promise<string> {
    const data = createHabitSchema.parse(input),
        id = newId();
    await saveActivity(context, 'habit', id, fields(data), data, true, state);
    return id;
}
export async function updateHabit(
    context: TasksContext,
    id: string,
    input: UpdateHabitInput,
    state?: ActivityState,
): Promise<void> {
    const patch = updateHabitSchema.parse(input),
        previous = await findHabit(context, id);
    if (!previous) throw new Error('not-found');
    const merged = createHabitSchema.parse({
        ...previous,
        ...patch,
        goal: patch.goal === null ? undefined : (patch.goal ?? previous.goal ?? undefined),
        description:
            patch.description === null
                ? undefined
                : (patch.description ?? previous.description ?? undefined),
        reminderAt: undefined,
    });
    const values = fields(merged);
    values.status = merged.repeatFreq === 'ninguna' ? (previous.status ?? 'pendiente') : null;
    values.completed_at = merged.repeatFreq === 'ninguna' ? previous.completedAt : null;
    await saveActivity(context, 'habit', id, values, patch, false, state);
}
export async function deleteHabit(context: TasksContext, id: string): Promise<void> {
    await deleteActivity(context, 'habit', id);
}
function fields(data: CreateHabitInput): ActivityFields {
    return {
        title: data.title,
        goal: data.goal ?? null,
        description: data.description ?? null,
        date: data.date,
        time: data.time ?? null,
        repeat_freq: data.repeatFreq,
        status: data.repeatFreq === 'ninguna' ? 'pendiente' : null,
        completed_at: null,
    };
}
