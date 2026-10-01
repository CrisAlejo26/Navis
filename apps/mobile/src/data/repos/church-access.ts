import { getDb, nowIso } from '../db';
import type { LocalChurch } from './church-repo';
export { repairChurchAccess } from '../church-access-repair';

export async function listMyChurches(userId: string): Promise<LocalChurch[]> {
    const db = await getDb();
    return db.getAllAsync<LocalChurch>(
        `SELECT c.id, c.name, c.slug, c.city, c.timezone, c.country, c.owner_id AS ownerId
         FROM churches c JOIN church_members m ON m.church_id = c.id
         WHERE m.user_id = ? AND m.deleted_at IS NULL AND c.deleted_at IS NULL
         ORDER BY c.created_at, c.id`,
        userId,
    );
}

export async function setActiveChurch(userId: string, churchId: string): Promise<void> {
    const db = await getDb();
    await db.withTransactionAsync(async () => {
        const accessible = await db.getFirstAsync<{ id: string }>(
            `SELECT c.id FROM churches c JOIN church_members m ON m.church_id = c.id
             WHERE m.church_id = ? AND m.user_id = ? AND c.deleted_at IS NULL AND m.deleted_at IS NULL`,
            churchId,
            userId,
        );
        if (!accessible) throw new Error('not-found');
        await db.runAsync(
            'UPDATE local_user SET active_church_id = ?, updated_at = ? WHERE id = ?',
            churchId,
            nowIso(),
            userId,
        );
    });
}

export async function resolveActiveChurch(userId: string): Promise<LocalChurch | null> {
    const db = await getDb();
    const churches = await listMyChurches(userId);
    const user = await db.getFirstAsync<{ active_church_id: string | null }>(
        'SELECT active_church_id FROM local_user WHERE id = ?',
        userId,
    );
    const active = churches.find((one) => one.id === user?.active_church_id) ?? churches[0] ?? null;
    if (active?.id !== user?.active_church_id) {
        await db.runAsync(
            'UPDATE local_user SET active_church_id = ? WHERE id = ?',
            active?.id ?? null,
            userId,
        );
    }
    return active;
}

/** Valida antes de cancelar consultas o modificar el contexto. */
export async function assertAccessible(userId: string, churchId: string): Promise<LocalChurch> {
    const church = (await listMyChurches(userId)).find((one) => one.id === churchId);
    if (!church) throw new Error('not-found');
    return church;
}
