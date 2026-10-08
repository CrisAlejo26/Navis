import { hasPermission, type MyRole, type Permission } from '@navis/shared';

import { getDb } from '../db';
import { findRoleBySlug } from './role-rows';
import { createRole, listRoles, removeRole, updateRole } from './roles-repo';
import { removeUser } from './user-removal';
import { createUser, getUser, listUsers, setPassword, updateUser } from './users-repo';
import { UsersError, type Asker, type UsersGateway } from './users-gateway';

async function roleOf(asker: Asker): Promise<MyRole> {
    const db = await getDb();
    const row = await db.getFirstAsync<{ role: string }>(
        'SELECT role FROM local_user WHERE id = ?',
        asker.userId,
    );
    const role = row ? await findRoleBySlug(db, row.role) : null;
    if (!role) throw new UsersError('not-found');
    return { slug: role.slug, permissions: role.permissions };
}

/** Lo que en la API hace `PermissionsGuard`: sin el permiso, ni se toca la base. */
async function requirePermission(asker: Asker, permission: Permission): Promise<void> {
    if (!hasPermission((await roleOf(asker)).permissions, permission))
        throw new UsersError('forbidden-permission');
}

/**
 * El adaptador local del puerto: SQLite. Las reglas viven en los repos —no en
 * las pantallas— porque son las mismas que aplica el servidor, y un test de
 * contrato las comprueba contra este adaptador y, mañana, contra el remoto.
 */
export const localUsersGateway: UsersGateway = {
    async listUsers(asker, query) {
        await requirePermission(asker, 'users.view');
        return listUsers(asker, query);
    },
    async getUser(asker, id) {
        await requirePermission(asker, 'users.view');
        return getUser(asker, id);
    },
    async createUser(asker, input) {
        await requirePermission(asker, 'users.manage');
        return createUser(asker, input);
    },
    async updateUser(asker, id, input) {
        await requirePermission(asker, 'users.manage');
        return updateUser(asker, id, input);
    },
    async setPassword(asker, id, password) {
        await requirePermission(asker, 'users.manage');
        return setPassword(asker, id, password);
    },
    async removeUser(asker, id, decisions) {
        await requirePermission(asker, 'users.manage');
        return removeUser(asker, id, decisions);
    },
    // Como en la API, leer el catálogo solo pide sesión: lo necesita cualquiera
    // para pintar el nombre de su rol.
    listRoles: (_asker, query) => listRoles(query),
    async createRole(asker, input) {
        await requirePermission(asker, 'roles.manage');
        return createRole(input);
    },
    async updateRole(asker, id, input) {
        await requirePermission(asker, 'roles.manage');
        return updateRole(id, input);
    },
    async removeRole(asker, id) {
        await requirePermission(asker, 'roles.manage');
        return removeRole(id);
    },
    myRole: roleOf,
};
