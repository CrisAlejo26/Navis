import type {
    CreateManagedUserInput,
    ManagedUser,
    ManagedUsersQuery,
    Paginated,
    UpdateManagedUserInput,
} from '@navis/shared';

import { getDb, newId, nowIso } from '../db';
import { hashPassword } from '../repos/account-repo';
import type { LocalDb } from '../local-db';
import { joinChurch, leaveNonOwnedChurches } from './user-churches';
import { assignableRole, askerContext, grantsChurchManagement, loadTarget } from './user-rules';
import { UsersError, type Asker } from './users-gateway';
import { USER_COLUMNS, toManagedUser, type UserDbRow } from './user-rows';
import { queryUsers } from './users-query';

async function loadUser(db: LocalDb, id: string): Promise<ManagedUser> {
    const row = await db.getFirstAsync<UserDbRow>(
        `SELECT ${USER_COLUMNS} FROM local_user u WHERE u.id = ?`,
        id,
    );
    if (!row) throw new UsersError('not-found');
    return toManagedUser(row);
}

async function assertEmailFree(db: LocalDb, email: string, exceptId?: string): Promise<void> {
    const taken = await db.getFirstAsync<{ id: string }>(
        'SELECT id FROM local_user WHERE email = ? AND id <> ?',
        email,
        exceptId ?? '',
    );
    if (taken) throw new UsersError('email-taken');
}

export async function listUsers(
    asker: Asker,
    query: ManagedUsersQuery,
): Promise<Paginated<ManagedUser>> {
    const db = await getDb();
    const ctx = await askerContext(db, asker);
    return queryUsers(db, ctx, query);
}

/** La propia cuenta siempre se puede leer; las demás, solo si hay una iglesia en común. */
export async function getUser(asker: Asker, id: string): Promise<ManagedUser> {
    const db = await getDb();
    const ctx = await askerContext(db, asker);
    if (id !== ctx.userId) await loadTarget(db, ctx, id);
    return loadUser(db, id);
}

export async function createUser(
    asker: Asker,
    input: CreateManagedUserInput,
): Promise<ManagedUser> {
    const db = await getDb();
    const ctx = await askerContext(db, asker);
    const role = await assignableRole(db, ctx, input.role);
    const email = input.email.toLowerCase();
    await assertEmailFree(db, email);
    const id = newId();
    const now = nowIso();
    const hash = await hashPassword(email, input.password);
    await db.withTransactionAsync(async () => {
        await db.runAsync(
            `INSERT INTO local_user (id, name, email, password_hash, role, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            id,
            input.name,
            email,
            hash,
            role.slug,
            now,
            now,
        );
        // Quien administra iglesias propias monta las suyas; el resto entra en la activa.
        if (!grantsChurchManagement(role)) await joinChurch(db, id, asker.churchId);
    });
    return loadUser(db, id);
}

export async function updateUser(
    asker: Asker,
    id: string,
    input: UpdateManagedUserInput,
): Promise<ManagedUser> {
    const db = await getDb();
    const ctx = await askerContext(db, asker);
    const target = await loadTarget(db, ctx, id);
    const role = input.role ? await assignableRole(db, ctx, input.role) : null;
    const email = input.email?.toLowerCase();
    if (email) await assertEmailFree(db, email, id);
    await db.withTransactionAsync(async () => {
        await db.runAsync(
            `UPDATE local_user SET name = COALESCE(?, name), email = COALESCE(?, email),
             role = COALESCE(?, role), updated_at = ? WHERE id = ?`,
            input.name ?? null,
            email ?? null,
            role?.slug ?? null,
            nowIso(),
            id,
        );
        if (role && role.slug !== target.role && grantsChurchManagement(role))
            await leaveNonOwnedChurches(db, id);
    });
    // El correo es la sal del hash: al cambiarlo, la contraseña vieja ya no vale
    // y quien administra tiene que poner una nueva (se avisa en la pantalla).
    return loadUser(db, id);
}

export async function setPassword(asker: Asker, id: string, password: string): Promise<void> {
    const db = await getDb();
    const ctx = await askerContext(db, asker);
    const target = await loadTarget(db, ctx, id);
    await db.runAsync(
        'UPDATE local_user SET password_hash = ?, updated_at = ? WHERE id = ?',
        await hashPassword(target.email, password),
        nowIso(),
        id,
    );
}
