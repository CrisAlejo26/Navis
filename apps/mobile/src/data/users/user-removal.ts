import {
    ALL_LOCAL_TABLES,
    SUPERADMIN_ROLE,
    type ChurchDecision,
    type OwnedChurchImpact,
} from '@navis/shared';

import { getDb, nowIso } from '../db';
import type { LocalDb } from '../local-db';
import { leaveNonOwnedChurches } from './user-churches';
import { askerContext, loadTarget } from './user-rules';
import { UsersError, type Asker } from './users-gateway';

async function count(db: LocalDb, table: string, churchId: string): Promise<number> {
    const row = await db.getFirstAsync<{ n: number }>(
        `SELECT COUNT(*) AS n FROM ${table} WHERE church_id = ? AND deleted_at IS NULL`,
        churchId,
    );
    return row?.n ?? 0;
}

/** Cuánto se lleva por delante cada iglesia propia: es lo que enseña el paso 2 de la baja (RFC 0015). */
export async function ownedChurchImpacts(
    db: LocalDb,
    userId: string,
): Promise<OwnedChurchImpact[]> {
    const owned = await db.getAllAsync<{ id: string; name: string }>(
        'SELECT id, name FROM churches WHERE owner_id = ? AND deleted_at IS NULL ORDER BY created_at, id',
        userId,
    );
    const impacts: OwnedChurchImpact[] = [];
    for (const church of owned) {
        impacts.push({
            id: church.id,
            name: church.name,
            believers: await count(db, 'believers', church.id),
            notes: await count(db, 'believer_notes', church.id),
            lists: await count(db, 'lists', church.id),
            calendars: await count(db, 'calendars', church.id),
            congregations: await count(db, 'congregations', church.id),
            members: await count(db, 'church_members', church.id),
        });
    }
    return impacts;
}

/**
 * Todo lo de la iglesia a `deleted_at`, sin borrar nada de verdad (RFC 0015 D5).
 * Se recorre el esquema en vez de listar tablas a mano: una tabla nueva con
 * `church_id` entra sola. Las hijas sin `church_id` quedan inalcanzables por su
 * padre.
 */
async function deleteChurchData(db: LocalDb, churchId: string): Promise<void> {
    const now = nowIso();
    for (const table of ALL_LOCAL_TABLES) {
        const names = table.columns.map((one) => one.name);
        if (!names.includes('church_id') || !names.includes('deleted_at')) continue;
        await db.runAsync(
            `UPDATE ${table.name} SET deleted_at = ?, updated_at = ? WHERE church_id = ? AND deleted_at IS NULL`,
            now,
            now,
            churchId,
        );
    }
    await db.runAsync(
        'UPDATE churches SET deleted_at = ?, updated_at = ? WHERE id = ? AND deleted_at IS NULL',
        now,
        now,
        churchId,
    );
}

export async function removeUser(
    asker: Asker,
    id: string,
    decisions: ChurchDecision[] = [],
): Promise<void> {
    const db = await getDb();
    const ctx = await askerContext(db, asker);
    const target = await loadTarget(db, ctx, id);
    if (target.role === SUPERADMIN_ROLE) {
        const admins = await db.getFirstAsync<{ n: number }>(
            'SELECT COUNT(*) AS n FROM local_user WHERE role = ?',
            SUPERADMIN_ROLE,
        );
        if ((admins?.n ?? 0) <= 1) throw new UsersError('last-admin');
    }
    const impacts = await ownedChurchImpacts(db, id);
    const decided = new Set(decisions.map((one) => one.churchId));
    if (impacts.some((one) => !decided.has(one.id)))
        throw new UsersError('owns-churches', { ownedChurches: impacts });
    // El traslado funde catálogos y mueve ficheros: no está en local todavía.
    if (decisions.some((one) => one.action === 'transfer'))
        throw new UsersError('transfer-unsupported');

    await db.withTransactionAsync(async () => {
        for (const one of impacts) await deleteChurchData(db, one.id);
        await leaveNonOwnedChurches(db, id);
        await db.runAsync('DELETE FROM local_user WHERE id = ?', id);
    });
}
