import type { TaskStatus, HabitStatus } from '@navis/shared';
import { inLocalTransaction } from '../local-transaction';
import { tasksDb, type TasksContext } from './tasks-context';
import { writeActivityStatus } from './activity-status-write';

export async function setTaskStatus(
    context: TasksContext,
    id: string,
    date: string,
    status: TaskStatus,
): Promise<void> {
    const db = await tasksDb(context);
    await inLocalTransaction(db, (tx) =>
        writeActivityStatus(tx, context, 'task', id, { date, status }),
    );
}
export async function setHabitStatus(
    context: TasksContext,
    id: string,
    date: string,
    status: HabitStatus,
): Promise<void> {
    const db = await tasksDb(context);
    await inLocalTransaction(db, (tx) =>
        writeActivityStatus(tx, context, 'habit', id, { date, status }),
    );
}
