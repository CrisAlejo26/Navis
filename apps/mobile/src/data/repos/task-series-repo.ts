import { changeTaskSeries, taskSeriesActionSchema, taskOrderSchema, type TaskSeriesActionInput } from '@navis/shared';
import { inLocalTransaction } from '../local-transaction';
import { nowIso } from '../db';
import { tasksDb, type TasksContext } from './tasks-context';
import { taskRecords, type TaskRecord } from './task-records';

export async function taskTemplates(context: TasksContext, recurring: boolean, page = 1) {
    const db = await tasksDb(context);
    const limit = 100;
    const items = await taskRecords(db, context, { recurring, manual: true, limit, offset: (page - 1) * limit });
    const row = await db.getFirstAsync<{ total: number }>(`SELECT COUNT(*) AS total FROM tasks WHERE church_id = ? AND owner_id = ? AND deleted_at IS NULL${recurring ? ' AND is_recurring = 1' : ''}`, context.churchId, context.userId);
    const total = row?.total ?? 0;
    return { items, page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) };
}
export async function actOnTaskSeries(context: TasksContext, id: string, input: TaskSeriesActionInput): Promise<void> {
    const command = taskSeriesActionSchema.parse(input), db = await tasksDb(context);
    await inLocalTransaction(db, async (tx) => {
        const task = (await taskRecords(tx, context, { id }))[0];
        if (!task?.isRecurring) throw new Error('not-found');
        if (command.date < task.date) throw new Error('series-date');
        const next = changeTaskSeries(task, command);
        await tx.runAsync('UPDATE tasks SET repeat_pauses = ?, repeat_stopped_at = ?, updated_at = ? WHERE id = ? AND church_id = ? AND owner_id = ? AND deleted_at IS NULL', JSON.stringify(next.repeatPauses), next.repeatStoppedAt, nowIso(), id, context.churchId, context.userId);
    });
}
export async function orderTasks(context: TasksContext, input: { ids: string[] }): Promise<void> {
    const { ids } = taskOrderSchema.parse(input), db = await tasksDb(context);
    await inLocalTransaction(db, async (tx) => {
        const tasks: TaskRecord[] = [];
        for (let offset = 0; ; offset += 100) {
            const page = await taskRecords(tx, context, { limit: 100, offset, manual: true });
            tasks.push(...page);
            if (page.length < 100) break;
        }
        if (ids.some((id) => !tasks.some((task) => task.id === id))) throw new Error('not-found');
        const rest = tasks.filter((task) => !ids.includes(task.id)).sort((a, b) => (a.manualOrder ?? Infinity) - (b.manualOrder ?? Infinity) || a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
        for (const [index, id] of [...ids, ...rest.map((task) => task.id)].entries()) await tx.runAsync('UPDATE tasks SET manual_order = ?, updated_at = ? WHERE id = ? AND church_id = ? AND owner_id = ? AND deleted_at IS NULL', index, nowIso(), id, context.churchId, context.userId);
    });
}
