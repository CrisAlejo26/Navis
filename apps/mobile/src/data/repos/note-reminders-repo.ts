import { getDb } from '../db';

/** Un recordatorio de nota que aún no se ha dado por hecho, con quién es el hermano. */
export interface PendingNoteReminder {
    churchId: string;
    churchName: string;
    noteId: string;
    believerId: string;
    firstName: string;
    lastName: string;
    /** Tal y como se guardó: `AAAA-MM-DDTHH:mm:00`, hora local del teléfono. */
    remindAt: string;
    remindText: string | null;
}

interface ReminderRow {
    church_id: string;
    church_name: string;
    note_id: string;
    believer_id: string;
    first_name: string;
    last_name: string;
    remind_at: string;
    remind_text: string | null;
}

/**
 * Los recordatorios pendientes de todas las membresías vigentes del usuario.
 * Sin filtrar por fecha
 * en SQL: la comparación de instantes se hace con `Date` en quien los usa, así
 * no depende de cómo se escribió la cadena. Solo los de su autoría (o sin
 * autor): el aviso es «recuérdame», no «recuérdales a todos».
 */
export async function listPendingNoteReminders(userId: string): Promise<PendingNoteReminder[]> {
    const db = await getDb();
    const rows = await db.getAllAsync<ReminderRow>(
        `SELECT n.id AS note_id, n.church_id, c.name AS church_name,
                n.believer_id, b.first_name, b.last_name, n.remind_at, n.remind_text
     FROM believer_notes n
     JOIN believers b ON b.id = n.believer_id AND b.church_id = n.church_id
     JOIN churches c ON c.id = n.church_id AND c.deleted_at IS NULL
     WHERE n.deleted_at IS NULL AND b.deleted_at IS NULL
       AND EXISTS (SELECT 1 FROM church_members m WHERE m.church_id = n.church_id
                   AND m.user_id = ? AND m.deleted_at IS NULL)
       AND n.remind_at IS NOT NULL AND n.remind_done_at IS NULL
       AND (n.author_id = ? OR n.author_id IS NULL)`,
        userId,
        userId,
    );
    return rows.map((row) => ({
        churchId: row.church_id,
        churchName: row.church_name,
        noteId: row.note_id,
        believerId: row.believer_id,
        firstName: row.first_name,
        lastName: row.last_name,
        remindAt: row.remind_at,
        remindText: row.remind_text,
    }));
}
