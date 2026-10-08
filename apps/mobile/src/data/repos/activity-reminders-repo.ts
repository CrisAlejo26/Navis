import { getDb } from '../db';
import type { ActivityKind } from './tasks-context';

/** El recordatorio de una tarea o un hábito que aún puede sonar, con su iglesia. */
export interface PendingActivityReminder {
    kind: ActivityKind;
    id: string;
    churchId: string;
    churchName: string;
    title: string;
    description: string | null;
    /** Instante ISO: se guardó ya convertido desde la hora de la iglesia. */
    remindAt: string;
}

interface ReminderRow {
    id: string;
    church_id: string;
    church_name: string;
    title: string;
    description: string | null;
    remind_at: string;
}

/** Una tarea ya hecha no vuelve a avisar, salvo que sea una serie (sigue viva). */
const OPEN_FILTER = { task: `AND (a.is_recurring = 1 OR a.status <> 'completada')`, habit: '' };

/**
 * Los recordatorios activados de todas las membresías vigentes del usuario.
 * Solo los suyos (`owner_id`): una tarea es personal. Sin filtrar por fecha en
 * SQL, como en las notas: el instante se compara con `Date` en quien lo usa.
 */
export async function listPendingActivityReminders(
    userId: string,
): Promise<PendingActivityReminder[]> {
    const db = await getDb();
    const result: PendingActivityReminder[] = [];
    for (const kind of ['task', 'habit'] as const) {
        const rows = await db.getAllAsync<ReminderRow>(
            `SELECT a.id, a.church_id, c.name AS church_name, a.title, a.description, r.remind_at
             FROM ${kind}_reminders r
             JOIN ${kind}s a ON a.id = r.${kind}_id
             JOIN churches c ON c.id = a.church_id AND c.deleted_at IS NULL
             WHERE r.deleted_at IS NULL AND r.enabled = 1 AND a.deleted_at IS NULL
               AND a.owner_id = ? ${OPEN_FILTER[kind]}
               AND EXISTS (SELECT 1 FROM church_members m WHERE m.church_id = a.church_id
                           AND m.user_id = ? AND m.deleted_at IS NULL)`,
            userId,
            userId,
        );
        for (const row of rows)
            result.push({
                kind,
                id: row.id,
                churchId: row.church_id,
                churchName: row.church_name,
                title: row.title,
                description: row.description,
                remindAt: row.remind_at,
            });
    }
    return result;
}

/** Para validar un aviso al tocarlo: la actividad sigue viva y es de quien lo toca. */
export async function isOwnActivity(
    userId: string,
    churchId: string,
    kind: ActivityKind,
    id: string,
): Promise<boolean> {
    const db = await getDb();
    const row = await db.getFirstAsync<{ id: string }>(
        `SELECT id FROM ${kind}s WHERE id = ? AND church_id = ? AND owner_id = ? AND deleted_at IS NULL`,
        id,
        churchId,
        userId,
    );
    return Boolean(row);
}
