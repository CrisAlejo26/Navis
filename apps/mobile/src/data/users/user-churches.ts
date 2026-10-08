import type { LocalDb } from '../local-db';
import { newId, nowIso } from '../local-db';

/** Añade la cuenta a una iglesia, o reactiva su pertenencia si ya la había tenido. */
export async function joinChurch(db: LocalDb, userId: string, churchId: string): Promise<void> {
    const now = nowIso();
    const existing = await db.getFirstAsync<{ id: string }>(
        'SELECT id FROM church_members WHERE church_id = ? AND user_id = ?',
        churchId,
        userId,
    );
    if (existing) {
        await db.runAsync(
            'UPDATE church_members SET deleted_at = NULL, updated_at = ? WHERE id = ?',
            now,
            existing.id,
        );
        return;
    }
    await db.runAsync(
        'INSERT INTO church_members (id, church_id, user_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
        newId(),
        churchId,
        userId,
        now,
        now,
    );
}

/**
 * Saca a la cuenta de las iglesias de las que no es dueña. Es lo que pasa al
 * darle un rol que administra iglesias propias (RFC 0014): deja de colgar de
 * las ajenas. La activa se repara sola en la siguiente lectura
 * (`resolveActiveChurch`).
 */
export async function leaveNonOwnedChurches(db: LocalDb, userId: string): Promise<void> {
    await db.runAsync(
        `UPDATE church_members SET deleted_at = ?, updated_at = ?
         WHERE user_id = ? AND deleted_at IS NULL
         AND church_id NOT IN (SELECT id FROM churches WHERE owner_id = ?)`,
        nowIso(),
        nowIso(),
        userId,
        userId,
    );
}
