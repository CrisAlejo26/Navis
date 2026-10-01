import { getDb, nowIso } from '../db';
import { assertInChurch } from '../church-scope';

export async function deleteCalendar(churchId: string, calendarId: string): Promise<void> {
    const db = await getDb();
    await assertInChurch(db, 'calendars', calendarId, churchId);
    const count = await db.getFirstAsync<{ total: number }>(
        'SELECT COUNT(*) AS total FROM calendars WHERE church_id = ? AND deleted_at IS NULL',
        churchId,
    );
    if ((count?.total ?? 0) <= 1) throw new Error('No se puede borrar el único calendario');
    await db.runAsync(
        'UPDATE calendars SET deleted_at = ?, updated_at = ? WHERE id = ? AND church_id = ?',
        nowIso(),
        nowIso(),
        calendarId,
        churchId,
    );
}

export async function deleteCongregation(churchId: string, congregationId: string): Promise<void> {
    const db = await getDb();
    await assertInChurch(db, 'congregations', congregationId, churchId);
    const count = await db.getFirstAsync<{ total: number }>(
        'SELECT COUNT(*) AS total FROM congregations WHERE church_id = ? AND deleted_at IS NULL',
        churchId,
    );
    if ((count?.total ?? 0) <= 1) throw new Error('No se puede borrar la última sede');
    await db.runAsync(
        'UPDATE congregations SET deleted_at = ?, updated_at = ? WHERE id = ? AND church_id = ?',
        nowIso(),
        nowIso(),
        congregationId,
        churchId,
    );
}
