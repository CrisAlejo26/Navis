import { getDb } from '../db';

/** Una tarea «en progreso» con tiempo máximo: lo que puede disparar la alarma. */
export interface PendingTaskDeadline {
    id: string;
    churchId: string;
    churchName: string;
    title: string;
    /** Instante ISO guardado ya convertido desde la hora de la iglesia. */
    inProgressDeadline: string;
}

interface DeadlineRow {
    id: string;
    church_id: string;
    church_name: string;
    title: string;
    in_progress_deadline: string;
}

/**
 * Las tareas «en progreso» con límite de tiempo de todas las membresías
 * vigentes del usuario (Fase 7a). Solo las suyas y no repetitivas. Sin filtrar
 * por hora en SQL: el instante se compara con `Date` en quien lo usa.
 */
export async function listPendingTaskDeadlines(userId: string): Promise<PendingTaskDeadline[]> {
    const db = await getDb();
    const rows = await db.getAllAsync<DeadlineRow>(
        `SELECT t.id, t.church_id, c.name AS church_name, t.title, t.in_progress_deadline
         FROM tasks t
         JOIN churches c ON c.id = t.church_id AND c.deleted_at IS NULL
         WHERE t.deleted_at IS NULL AND t.owner_id = ? AND t.is_recurring = 0
           AND t.status = 'en_progreso' AND t.in_progress_deadline IS NOT NULL
           AND EXISTS (SELECT 1 FROM church_members m WHERE m.church_id = t.church_id
                       AND m.user_id = ? AND m.deleted_at IS NULL)`,
        userId,
        userId,
    );
    return rows.map((row) => ({
        id: row.id,
        churchId: row.church_id,
        churchName: row.church_name,
        title: row.title,
        inProgressDeadline: row.in_progress_deadline,
    }));
}
