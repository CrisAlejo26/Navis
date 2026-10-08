import type { RoleRow } from '@navis/shared';

import type { LocalDb } from '../local-db';

export interface RoleDbRow {
    id: string;
    slug: string;
    name: string | null;
    description: string | null;
    level: number;
    permissions: string;
    is_system: number;
    users_count: number;
}

/** `COUNT` de las cuentas con ese rol, como columna de la consulta de roles. */
export const ROLE_SELECT = `SELECT r.id, r.slug, r.name, r.description, r.level, r.permissions, r.is_system,
    (SELECT COUNT(*) FROM local_user u WHERE u.role = r.slug) AS users_count
    FROM roles r`;

function isStringArray(value: unknown): value is string[] {
    return Array.isArray(value) && value.every((one) => typeof one === 'string');
}

/** Los permisos son texto en la base: un valor roto no concede nada en vez de reventar. */
function parsePermissions(raw: string): string[] {
    try {
        const parsed: unknown = JSON.parse(raw);
        return isStringArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

export function toRoleRow(row: RoleDbRow): RoleRow {
    return {
        id: row.id,
        slug: row.slug,
        name: row.name,
        description: row.description,
        level: row.level,
        permissions: parsePermissions(row.permissions),
        isSystem: row.is_system === 1,
        usersCount: row.users_count,
    };
}

export async function findRoleBySlug(db: LocalDb, slug: string): Promise<RoleRow | null> {
    const row = await db.getFirstAsync<RoleDbRow>(
        `${ROLE_SELECT} WHERE r.slug = ? AND r.deleted_at IS NULL`,
        slug,
    );
    return row ? toRoleRow(row) : null;
}

export async function findRoleById(db: LocalDb, id: string): Promise<RoleRow | null> {
    const row = await db.getFirstAsync<RoleDbRow>(
        `${ROLE_SELECT} WHERE r.id = ? AND r.deleted_at IS NULL`,
        id,
    );
    return row ? toRoleRow(row) : null;
}
