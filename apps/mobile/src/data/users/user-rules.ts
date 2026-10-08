import { SUPERADMIN_ROLE, canAssignRoleLevel, hasPermission, type RoleRow } from '@navis/shared';

import type { LocalDb } from '../local-db';
import { findRoleBySlug } from './role-rows';
import { UsersError, type Asker } from './users-gateway';

/** Quién pregunta, con el nivel de su rol: de él dependen el alcance y el tope. */
export interface AskerContext {
    userId: string;
    level: number;
    isSuperadmin: boolean;
}

export interface TargetRow {
    id: string;
    role: string;
    email: string;
}

export async function askerContext(db: LocalDb, asker: Asker): Promise<AskerContext> {
    const row = await db.getFirstAsync<{ role: string }>(
        'SELECT role FROM local_user WHERE id = ?',
        asker.userId,
    );
    if (!row) throw new UsersError('not-found');
    const role = await findRoleBySlug(db, row.role);
    return {
        userId: asker.userId,
        level: role?.level ?? 0,
        isSuperadmin: row.role === SUPERADMIN_ROLE,
    };
}

/** La cuenta sobre la que se actúa: existe, no es la propia y comparte iglesia (o quien pregunta es superadmin). */
export async function loadTarget(db: LocalDb, ctx: AskerContext, id: string): Promise<TargetRow> {
    const target = await db.getFirstAsync<TargetRow>(
        'SELECT id, role, email FROM local_user WHERE id = ?',
        id,
    );
    if (!target) throw new UsersError('not-found');
    if (target.id === ctx.userId) throw new UsersError('forbidden-self');
    if (ctx.isSuperadmin) return target;
    const shared = await db.getFirstAsync<{ id: string }>(
        `SELECT t.id FROM church_members t JOIN church_members a ON a.church_id = t.church_id
         WHERE t.user_id = ? AND a.user_id = ? AND t.deleted_at IS NULL AND a.deleted_at IS NULL`,
        id,
        ctx.userId,
    );
    if (!shared) throw new UsersError('forbidden-scope');
    return target;
}

/** El rol existe y no es de nivel igual o superior al de quien lo reparte (RFC 0014 D2). */
export async function assignableRole(
    db: LocalDb,
    ctx: AskerContext,
    slug: string,
): Promise<RoleRow> {
    const role = await findRoleBySlug(db, slug);
    if (!role) throw new UsersError('invalid-role');
    if (!ctx.isSuperadmin && !canAssignRoleLevel(ctx.level, role.level))
        throw new UsersError('role-ceiling');
    return role;
}

export function grantsChurchManagement(role: RoleRow): boolean {
    return hasPermission(role.permissions, 'churches.manage');
}
