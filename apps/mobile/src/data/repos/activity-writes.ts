import { writeActivityReminder } from './task-reminders';
import { nowIso } from '../db';
import { inLocalTransaction } from '../local-transaction';
import { requireActivity, tasksDb, type ActivityKind, type TasksContext } from './tasks-context';
import { requireTaskTags, replaceActivityTags } from './task-relations';

export type ActivityFields = Record<string, string | number | null>;
export interface ActivityRelations {
    tagIds?: string[];
    reminderEnabled?: boolean;
    reminderAt?: string | null;
    reminderTagIds?: string[];
}

/** The caller supplies validated fields; all relation changes commit together. */
export async function saveActivity(
    context: TasksContext,
    kind: ActivityKind,
    id: string,
    fields: ActivityFields,
    relations: ActivityRelations,
    create: boolean,
): Promise<void> {
    const db = await tasksDb(context);
    await inLocalTransaction(db, async (tx) => {
        if (!create) await requireActivity(tx, context, kind, id);
        await requireTaskTags(tx, context, [
            ...(relations.tagIds ?? []),
            ...(relations.reminderTagIds ?? []),
        ]);
        const keys = Object.keys(fields);
        if (create) {
            const table = `${kind}s`;
            await tx.runAsync(
                `INSERT INTO ${table} (id, created_at, updated_at, deleted_at, church_id, owner_id, ${keys.join(', ')})
                 VALUES (?, ?, ?, NULL, ?, ?, ${keys.map(() => '?').join(', ')})`,
                id,
                nowIso(),
                nowIso(),
                context.churchId,
                context.userId,
                ...keys.map((key) => fields[key]),
            );
        } else {
            await tx.runAsync(
                `UPDATE ${kind}s SET ${keys.map((key) => `${key} = ?`).join(', ')}, updated_at = ?
                WHERE id = ? AND church_id = ? AND owner_id = ? AND deleted_at IS NULL`,
                ...keys.map((key) => fields[key]),
                nowIso(),
                id,
                context.churchId,
                context.userId,
            );
        }
        if (relations.tagIds !== undefined)
            await replaceActivityTags(tx, context, kind, id, relations.tagIds);
        if (
            create ||
            relations.reminderEnabled !== undefined ||
            relations.reminderAt !== undefined ||
            relations.reminderTagIds !== undefined
        )
            await writeActivityReminder(
                tx,
                context,
                kind,
                id,
                relations,
                String(fields.date),
                fields.time === null ? null : String(fields.time),
            );
    });
}

export async function deleteActivity(
    context: TasksContext,
    kind: ActivityKind,
    id: string,
): Promise<void> {
    const db = await tasksDb(context);
    await inLocalTransaction(db, async (tx) => {
        await requireActivity(tx, context, kind, id);
        // Like API softRemove: materialized history stays; no new proposals are generated.
        await tx.runAsync(
            `UPDATE ${kind}s SET deleted_at = ?, updated_at = ? WHERE id = ? AND church_id = ? AND owner_id = ?`,
            nowIso(),
            nowIso(),
            id,
            context.churchId,
            context.userId,
        );
    });
}
