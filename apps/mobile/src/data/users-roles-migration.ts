import {
    LOCAL_INDEXES,
    LOCAL_TABLES,
    ROLES,
    ROLE_HIERARCHY,
    ROLE_PERMISSIONS,
    createIndexSql,
    createTableSql,
} from '@navis/shared';

import { newId, nowIso, type LocalDb } from './local-db';

/**
 * Gestión de usuarios en móvil, Fase 1: el catálogo de roles y el rol de cada
 * cuenta. En una base **nueva** la migración 1 ya crea `roles` y
 * `local_user.role`; aquí solo se crea lo que falte y se siembran los roles de
 * serie. Idempotente.
 *
 * Las cuentas que ya existían las creó quien montó sus iglesias, así que pasan
 * a `pastor` —lo que necesitan para administrar a las que den de alta— y no al
 * `creyente` por defecto de la columna nueva.
 */
export async function migrateUsersRoles(db: LocalDb): Promise<void> {
    const roles = LOCAL_TABLES.find((one) => one.name === 'roles');
    if (!roles) throw new Error('missing-roles-schema');
    await db.execAsync(createTableSql(roles).replace('CREATE TABLE', 'CREATE TABLE IF NOT EXISTS'));
    for (const index of LOCAL_INDEXES.filter((one) => one.table === 'roles')) {
        await db.execAsync(
            createIndexSql(index).replace(
                /^CREATE (UNIQUE )?INDEX/,
                'CREATE $1INDEX IF NOT EXISTS',
            ),
        );
    }

    const columns = await db.getAllAsync<{ name: string }>('PRAGMA table_info(local_user)');
    if (!columns.some((one) => one.name === 'role')) {
        await db.execAsync(
            "ALTER TABLE local_user ADD COLUMN role TEXT NOT NULL DEFAULT 'creyente'",
        );
        await db.runAsync("UPDATE local_user SET role = 'pastor'");
    }

    await seedSystemRoles(db);
}

async function seedSystemRoles(db: LocalDb): Promise<void> {
    const now = nowIso();
    for (const slug of ROLES) {
        const exists = await db.getFirstAsync<{ id: string }>(
            'SELECT id FROM roles WHERE slug = ?',
            slug,
        );
        if (exists) continue;
        await db.runAsync(
            `INSERT INTO roles (id, slug, name, description, level, permissions, is_system, created_at, updated_at)
             VALUES (?, ?, NULL, NULL, ?, ?, 1, ?, ?)`,
            newId(),
            slug,
            ROLE_HIERARCHY[slug],
            JSON.stringify(ROLE_PERMISSIONS[slug]),
            now,
            now,
        );
    }
}
