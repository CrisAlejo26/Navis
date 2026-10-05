import type { TagRef, TaskReminder } from '@navis/shared';
import { newId, nowIso, type LocalDb } from '../db';
import type { ActivityKind, TasksContext } from './tasks-context';
import { replaceActivityTags } from './task-relations';

export async function readActivityReminder(
    db: LocalDb,
    context: TasksContext,
    kind: ActivityKind,
    id: string,
): Promise<TaskReminder | null> {
    const row = await db.getFirstAsync<{ id: string; enabled: number; remind_at: string }>(
        `SELECT r.id, r.enabled, r.remind_at FROM ${kind}_reminders r JOIN ${kind}s p ON p.id = r.${kind}_id
         WHERE p.id = ? AND p.church_id = ? AND p.owner_id = ? AND r.deleted_at IS NULL`,
        id,
        context.churchId,
        context.userId,
    );
    if (!row) return null;
    const tags = await db.getAllAsync<TagRef>(
        `SELECT t.id, t.name, t.icon, t.accent FROM tags t JOIN ${kind}_reminder_tags l ON l.tag_id = t.id
         WHERE l.reminder_id = ? AND l.deleted_at IS NULL AND t.deleted_at IS NULL
         AND t.church_id = ? AND t.owner_id = ? ORDER BY t.position, t.id`,
        row.id,
        context.churchId,
        context.userId,
    );
    return { enabled: Boolean(row.enabled), remindAt: row.remind_at, tags };
}

export async function writeActivityReminder(
    db: LocalDb,
    context: TasksContext,
    kind: ActivityKind,
    id: string,
    input: { reminderEnabled?: boolean; reminderAt?: string | null; reminderTagIds?: string[] },
    date: string,
    time: string | null,
): Promise<void> {
    const previous = await readActivityReminder(db, context, kind, id);
    const row = await db.getFirstAsync<{ id: string }>(
        `SELECT r.id FROM ${kind}_reminders r JOIN ${kind}s p ON p.id = r.${kind}_id
         WHERE p.id = ? AND p.church_id = ? AND p.owner_id = ? AND p.deleted_at IS NULL`,
        id,
        context.churchId,
        context.userId,
    );
    const reminderId = row?.id ?? newId();
    const enabled =
        input.reminderAt === null ? false : (input.reminderEnabled ?? previous?.enabled ?? true);
    const at = input.reminderAt ?? previous?.remindAt ?? `${date}T${time ?? '09:00'}`;
    const instant = new Date(at);
    if (Number.isNaN(instant.getTime())) throw new Error('invalid-reminder');
    await db.runAsync(
        `INSERT INTO ${kind}_reminders (id, created_at, updated_at, deleted_at, ${kind}_id, enabled, remind_at)
         SELECT ?, ?, ?, NULL, p.id, ?, ? FROM ${kind}s p
         WHERE p.id = ? AND p.church_id = ? AND p.owner_id = ? AND p.deleted_at IS NULL
         ON CONFLICT(${kind}_id) DO UPDATE SET enabled = excluded.enabled,
         remind_at = excluded.remind_at, updated_at = excluded.updated_at, deleted_at = NULL`,
        reminderId,
        nowIso(),
        nowIso(),
        Number(enabled),
        instant.toISOString(),
        id,
        context.churchId,
        context.userId,
    );
    if (input.reminderTagIds !== undefined)
        await replaceActivityTags(db, context, kind, reminderId, input.reminderTagIds, true);
}
