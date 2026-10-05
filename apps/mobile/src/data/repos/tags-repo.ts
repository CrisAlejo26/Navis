import {
    createTagSchema,
    updateTagSchema,
    type CreateTagInput,
    type UpdateTagInput,
    type Tag,
} from '@navis/shared';
import { newId, nowIso } from '../db';
import { inLocalTransaction } from '../local-transaction';
import { tasksDb, type TasksContext } from './tasks-context';
import { requireTaskTags } from './task-relations';

export async function listTaskTags(context: TasksContext): Promise<Tag[]> {
    return (await tasksDb(context)).getAllAsync<Tag>(
        `SELECT id, name, icon, accent, position FROM tags WHERE church_id = ? AND owner_id = ?
         AND deleted_at IS NULL ORDER BY position, created_at, id`,
        context.churchId,
        context.userId,
    );
}
export async function createTaskTag(context: TasksContext, input: CreateTagInput): Promise<string> {
    const data = createTagSchema.parse(input),
        db = await tasksDb(context),
        id = newId();
    await inLocalTransaction(db, async (tx) => {
        const count = await tx.getFirstAsync<{ position: number }>(
            'SELECT COALESCE(MAX(position), -1) + 1 AS position FROM tags WHERE church_id = ? AND owner_id = ?',
            context.churchId,
            context.userId,
        );
        await tx.runAsync(
            'INSERT INTO tags (id, created_at, updated_at, deleted_at, church_id, owner_id, name, icon, accent, position) VALUES (?, ?, ?, NULL, ?, ?, ?, ?, ?, ?)',
            id,
            nowIso(),
            nowIso(),
            context.churchId,
            context.userId,
            data.name,
            data.icon,
            data.accent,
            count?.position ?? 0,
        );
    });
    return id;
}
export async function updateTaskTag(
    context: TasksContext,
    id: string,
    input: UpdateTagInput,
): Promise<void> {
    const patch = updateTagSchema.parse(input),
        db = await tasksDb(context);
    await inLocalTransaction(db, async (tx) => {
        await requireTaskTags(tx, context, [id]);
        const previous = await tx.getFirstAsync<Tag>(
            'SELECT id, name, icon, accent, position FROM tags WHERE id = ? AND church_id = ? AND owner_id = ?',
            id,
            context.churchId,
            context.userId,
        );
        if (!previous) throw new Error('not-found');
        const data = { ...previous, ...patch };
        await tx.runAsync(
            'UPDATE tags SET name = ?, icon = ?, accent = ?, updated_at = ? WHERE id = ? AND church_id = ? AND owner_id = ?',
            data.name,
            data.icon,
            data.accent,
            nowIso(),
            id,
            context.churchId,
            context.userId,
        );
    });
}
export async function deleteTaskTag(context: TasksContext, id: string): Promise<void> {
    const db = await tasksDb(context);
    await inLocalTransaction(db, async (tx) => {
        await requireTaskTags(tx, context, [id]);
        await tx.runAsync(
            'UPDATE tags SET deleted_at = ?, updated_at = ? WHERE id = ? AND church_id = ? AND owner_id = ?',
            nowIso(),
            nowIso(),
            id,
            context.churchId,
            context.userId,
        );
    });
}
