import { getDb } from '../db';

/** Un recordatorio de nota que aún no se ha dado por hecho, con quién es el hermano. */
export interface PendingNoteReminder {
    noteId: string;
    believerId: string;
    firstName: string;
    lastName: string;
    /** Tal y como se guardó: `AAAA-MM-DDTHH:mm:00`, hora local del teléfono. */
    remindAt: string;
    remindText: string | null;
}

interface ReminderRow {
    note_id: string;
    believer_id: string;
    first_name: string;
    last_name: string;
    remind_at: string;
    remind_text: string | null;
}

/**
 * Los recordatorios pendientes de quien tiene la sesión. Sin filtrar por fecha
 * en SQL: la comparación de instantes se hace con `Date` en quien los usa, así
 * no depende de cómo se escribió la cadena. Solo los de su autoría (o sin
 * autor): el aviso es «recuérdame», no «recuérdales a todos».
 */
export async function listPendingNoteReminders(
    churchId: string,
    userId: string,
): Promise<PendingNoteReminder[]> {
    const db = await getDb();
    const rows = await db.getAllAsync<ReminderRow>(
        `SELECT n.id AS note_id, n.believer_id, b.first_name, b.last_name, n.remind_at, n.remind_text
     FROM believer_notes n
     JOIN believers b ON b.id = n.believer_id
     WHERE n.church_id = ? AND n.deleted_at IS NULL AND b.deleted_at IS NULL
       AND n.remind_at IS NOT NULL AND n.remind_done_at IS NULL
       AND (n.author_id = ? OR n.author_id IS NULL)`,
        churchId,
        userId,
    );
    return rows.map((row) => ({
        noteId: row.note_id,
        believerId: row.believer_id,
        firstName: row.first_name,
        lastName: row.last_name,
        remindAt: row.remind_at,
        remindText: row.remind_text,
    }));
}
