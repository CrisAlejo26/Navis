import type { TagRef } from '@navis/shared';
import { newId, nowIso, type LocalDb } from '../db';
import type { ActivityKind, TasksContext } from './tasks-context';

export async function requireTaskTags(
    db: LocalDb,
    context: TasksContext,
    ids: readonly string[],
): Promise<void> {
    for (const id of new Set(ids)) {
        const tag = await db.getFirstAsync(
            'SELECT id FROM tags WHERE id = ? AND church_id = ? AND owner_id = ? AND deleted_at IS NULL',
            id,
            context.churchId,
            context.userId,
        );
        if (!tag) throw new Error('not-found');
    }
}

export async function readActivityTags(
    db: LocalDb,
    context: TasksContext,
    kind: ActivityKind,
    id: string,
): Promise<TagRef[]> {
    return db.getAllAsync<TagRef>(
        `SELECT t.id, t.name, t.icon, t.accent FROM tags t JOIN ${kind}_tags l ON l.tag_id = t.id
         JOIN ${kind}s p ON p.id = l.${kind}_id
         WHERE p.id = ? AND p.church_id = ? AND p.owner_id = ? AND l.deleted_at IS NULL
         AND t.deleted_at IS NULL AND t.church_id = p.church_id AND t.owner_id = p.owner_id
         ORDER BY t.position, t.created_at, t.id`,
        id,
        context.churchId,
        context.userId,
    );
}

export async function replaceActivityTags(
    db: LocalDb,
    context: TasksContext,
    kind: ActivityKind,
    id: string,
    ids: readonly string[],
    reminder = false,
): Promise<void> {
    const table = reminder ? `${kind}_reminder_tags` : `${kind}_tags`;
    const column = reminder ? 'reminder_id' : `${kind}_id`;
    const parent = reminder
        ? `SELECT p.id FROM ${kind}s p JOIN ${kind}_reminders r ON r.${kind}_id = p.id
           WHERE r.id = ? AND p.church_id = ? AND p.owner_id = ? AND p.deleted_at IS NULL`
        : `SELECT p.id FROM ${kind}s p WHERE p.id = ? AND p.church_id = ? AND p.owner_id = ? AND p.deleted_at IS NULL`;
    const scope = [id, context.churchId, context.userId];
    const activity = await db.getFirstAsync<{ id: string }>(parent, ...scope);
    if (!activity) throw new Error('not-found');
    await requireTaskTags(db, context, ids);
    await db.runAsync(
        `DELETE FROM ${table} WHERE ${column} = ? AND EXISTS
         (SELECT 1 FROM ${kind}s p WHERE p.id = ? AND p.church_id = ? AND p.owner_id = ? AND p.deleted_at IS NULL)`,
        id,
        activity.id,
        context.churchId,
        context.userId,
    );
    for (const tagId of new Set(ids))
        await db.runAsync(
            `INSERT INTO ${table} (id, created_at, updated_at, deleted_at, ${column}, tag_id)
             SELECT ?, ?, ?, NULL, ?, ? WHERE EXISTS
             (SELECT 1 FROM ${kind}s p WHERE p.id = ? AND p.church_id = ? AND p.owner_id = ? AND p.deleted_at IS NULL)`,
            newId(),
            nowIso(),
            nowIso(),
            id,
            tagId,
            activity.id,
            context.churchId,
            context.userId,
        );
}
