import { newId, type LocalDb } from './local-db';

/** Repara copias antiguas sin conceder acceso a miembros dados de baja. */
export async function repairChurchAccess(db: LocalDb): Promise<void> {
    const missing = await db.getAllAsync<{ id: string; owner_id: string; created_at: string }>(
        `SELECT c.id, c.owner_id, c.created_at FROM churches c
         WHERE c.deleted_at IS NULL AND NOT EXISTS (
             SELECT 1 FROM church_members m WHERE m.church_id = c.id AND m.user_id = c.owner_id
         )`,
    );
    for (const church of missing) {
        await db.runAsync(
            'INSERT INTO church_members (id, church_id, user_id, created_at, updated_at, deleted_at) VALUES (?, ?, ?, ?, ?, NULL)',
            newId(),
            church.id,
            church.owner_id,
            church.created_at,
            church.created_at,
        );
    }
    await db.runAsync(`UPDATE local_user SET active_church_id = NULL
        WHERE active_church_id IS NOT NULL AND NOT EXISTS (
            SELECT 1 FROM church_members m JOIN churches c ON c.id = m.church_id
            WHERE m.user_id = local_user.id AND c.id = local_user.active_church_id
            AND m.deleted_at IS NULL AND c.deleted_at IS NULL
        )`);
}
