import {
    SUPERADMIN_ROLE,
    toRoleSlug,
    type CreateRoleInput,
    type Paginated,
    type RoleRow,
    type RolesQuery,
    type UpdateRoleInput,
} from '@navis/shared';

import { getDb, newId, nowIso } from '../db';
import { ROLE_SELECT, findRoleById, findRoleBySlug, toRoleRow, type RoleDbRow } from './role-rows';
import { UsersError } from './users-gateway';

/** Columnas por las que se puede ordenar: nunca texto que venga de fuera dentro del SQL. */
const SORT_SQL = { slug: 'r.slug', level: 'r.level', usersCount: 'users_count' } as const;

export async function listRoles(query: RolesQuery): Promise<Paginated<RoleRow>> {
    const db = await getDb();
    const term = `%${(query.search ?? '').toLowerCase()}%`;
    const where =
        "r.deleted_at IS NULL AND (LOWER(r.slug) LIKE ? OR LOWER(COALESCE(r.name, '')) LIKE ?)";
    const total =
        (
            await db.getFirstAsync<{ n: number }>(
                `SELECT COUNT(*) AS n FROM roles r WHERE ${where}`,
                term,
                term,
            )
        )?.n ?? 0;
    const direction = query.order === 'desc' ? 'DESC' : 'ASC';
    const rows = await db.getAllAsync<RoleDbRow>(
        `${ROLE_SELECT} WHERE ${where} ORDER BY ${SORT_SQL[query.sort]} ${direction}, r.slug LIMIT ? OFFSET ?`,
        term,
        term,
        query.limit,
        (query.page - 1) * query.limit,
    );
    return {
        items: rows.map(toRoleRow),
        total,
        page: query.page,
        limit: query.limit,
        totalPages: Math.max(1, Math.ceil(total / query.limit)),
    };
}

export async function createRole(input: CreateRoleInput): Promise<RoleRow> {
    const db = await getDb();
    const slug = toRoleSlug(input.name);
    if (!slug || (await findRoleBySlug(db, slug))) throw new UsersError('name-taken');
    const now = nowIso();
    const id = newId();
    await db.runAsync(
        `INSERT INTO roles (id, slug, name, description, level, permissions, is_system, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?)`,
        id,
        slug,
        input.name,
        input.description ?? null,
        input.level,
        JSON.stringify(input.permissions),
        now,
        now,
    );
    const created = await findRoleById(db, id);
    if (!created) throw new UsersError('not-found');
    return created;
}

export async function updateRole(id: string, input: UpdateRoleInput): Promise<RoleRow> {
    const db = await getDb();
    const role = await findRoleById(db, id);
    if (!role) throw new UsersError('not-found');
    // Los de serie se traducen y fijan la jerarquía: solo descripción y permisos.
    if (role.isSystem && (input.name !== undefined || input.level !== undefined))
        throw new UsersError('role-locked');
    if (role.slug === SUPERADMIN_ROLE && input.permissions) throw new UsersError('role-locked');
    await db.runAsync(
        'UPDATE roles SET name = ?, description = ?, level = ?, permissions = ?, updated_at = ? WHERE id = ?',
        input.name ?? role.name,
        input.description === undefined ? role.description : input.description,
        input.level ?? role.level,
        JSON.stringify(input.permissions ?? role.permissions),
        nowIso(),
        id,
    );
    const updated = await findRoleById(db, id);
    if (!updated) throw new UsersError('not-found');
    return updated;
}

export async function removeRole(id: string): Promise<void> {
    const db = await getDb();
    const role = await findRoleById(db, id);
    if (!role) throw new UsersError('not-found');
    if (role.isSystem) throw new UsersError('role-locked');
    if (role.usersCount > 0) throw new UsersError('role-in-use');
    const now = nowIso();
    await db.runAsync('UPDATE roles SET deleted_at = ?, updated_at = ? WHERE id = ?', now, now, id);
}
