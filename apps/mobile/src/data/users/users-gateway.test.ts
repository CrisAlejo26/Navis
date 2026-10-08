import { setupLocalDb } from '@/data/test-support';
import { getDb, setDbForTests } from '@/data/db';
import { openDatabaseAsync } from 'expo-sqlite';
import {
    managedUsersQuerySchema,
    rolesQuerySchema,
    type CreateManagedUserInput,
} from '@navis/shared';

import { migrateUsersRoles } from '../users-roles-migration';
import { createAccount, login } from '../repos/account-repo';
import { createChurch } from '../repos/church-repo';
import { UsersError, type Asker } from './users-gateway';
import { localUsersGateway as gateway } from './local-users-gateway';

jest.mock('expo-sqlite', () => ({ __esModule: true, openDatabaseAsync: jest.fn() }));

const PASSWORD = 'MuySegura123';

/** El código de error de una promesa rechazada: lo que de verdad contrata el puerto. */
async function codeOf(promise: Promise<unknown>): Promise<string> {
    try {
        await promise;
    } catch (error) {
        if (error instanceof UsersError) return error.code;
        throw error;
    }
    return 'sin-error';
}

describe('gestión de usuarios (adaptador local)', () => {
    let fixture: Awaited<ReturnType<typeof setupLocalDb>>;
    beforeAll(async () => {
        fixture = await setupLocalDb({ setDbForTests, openDatabaseMock: openDatabaseAsync });
    });
    beforeEach(async () => {
        await fixture.clear();
        await migrateUsersRoles(await getDb());
    });
    afterAll(() => fixture.close());

    async function pastor(email: string, churchName: string) {
        const result = await createAccount({ name: churchName, email, password: PASSWORD });
        if ('error' in result) throw new Error(result.error);
        const church = await createChurch({ name: churchName, city: '', ownerId: result.user.id });
        const asker: Asker = { userId: result.user.id, churchId: church.id };
        return { asker, church };
    }

    const alta = (over: Partial<CreateManagedUserInput> = {}): CreateManagedUserInput => ({
        name: 'Ana Pérez',
        email: 'ana@navis.app',
        password: PASSWORD,
        role: 'recepcion',
        ...over,
    });
    const users = (asker: Asker, over: Record<string, unknown> = {}) =>
        gateway.listUsers(asker, managedUsersQuerySchema.parse(over));

    it('siembra los roles de serie una sola vez, aunque la migración se repita', async () => {
        const db = await getDb();
        await migrateUsersRoles(db);
        const roles = await gateway.listRoles(
            { userId: 'x', churchId: 'x' },
            rolesQuerySchema.parse({ limit: 100 }),
        );
        expect(roles.total).toBe(8);
        expect(roles.items.find((one) => one.slug === 'superadmin')?.permissions).toEqual(['*']);
        expect(roles.items.every((one) => one.isSystem)).toBe(true);
    });

    it('da de alta una cuenta en la iglesia activa y esa cuenta puede entrar', async () => {
        const { asker } = await pastor('pastor@navis.app', 'Norte');
        const created = await gateway.createUser(asker, alta());
        expect(created).toMatchObject({ email: 'ana@navis.app', role: 'recepcion' });
        expect((await users(asker)).items.map((one) => one.email)).toContain('ana@navis.app');
        expect(await login({ email: 'ana@navis.app', password: PASSWORD })).toHaveProperty('user');
    });

    it('rechaza un correo repetido', async () => {
        const { asker } = await pastor('pastor@navis.app', 'Norte');
        await gateway.createUser(asker, alta());
        expect(await codeOf(gateway.createUser(asker, alta({ name: 'Otra' })))).toBe('email-taken');
    });

    it('no reparte un rol de nivel igual o superior al propio (tope de rol)', async () => {
        const { asker } = await pastor('pastor@navis.app', 'Norte');
        expect(await codeOf(gateway.createUser(asker, alta({ role: 'pastor' })))).toBe(
            'role-ceiling',
        );
        expect(await codeOf(gateway.createUser(asker, alta({ role: 'superadmin' })))).toBe(
            'role-ceiling',
        );
        expect(await codeOf(gateway.createUser(asker, alta({ role: 'inventado' })))).toBe(
            'invalid-role',
        );
    });

    it('sin users.view no se lista ni se da de alta nadie', async () => {
        const { asker } = await pastor('pastor@navis.app', 'Norte');
        const ana = await gateway.createUser(asker, alta());
        const asAna: Asker = { userId: ana.id, churchId: asker.churchId };
        expect(await codeOf(users(asAna))).toBe('forbidden-permission');
        expect(await codeOf(gateway.createUser(asAna, alta({ email: 'b@navis.app' })))).toBe(
            'forbidden-permission',
        );
    });

    it('no deja editar ni borrar la propia cuenta', async () => {
        const { asker } = await pastor('pastor@navis.app', 'Norte');
        expect(await codeOf(gateway.updateUser(asker, asker.userId, { name: 'Yo' }))).toBe(
            'forbidden-self',
        );
        expect(await codeOf(gateway.removeUser(asker, asker.userId))).toBe('forbidden-self');
    });

    // Regresión de aislamiento: el alcance sale de las iglesias en común, no de la activa.
    it('no ve ni toca las cuentas de otra iglesia', async () => {
        const norte = await pastor('norte@navis.app', 'Norte');
        const sur = await pastor('sur@navis.app', 'Sur');
        const ana = await gateway.createUser(sur.asker, alta());
        const emails = (await users(norte.asker)).items.map((one) => one.email);
        expect(emails).toEqual(['norte@navis.app']);
        expect(await codeOf(gateway.updateUser(norte.asker, ana.id, { name: 'X' }))).toBe(
            'forbidden-scope',
        );
        expect(await codeOf(gateway.setPassword(norte.asker, ana.id, PASSWORD))).toBe(
            'forbidden-scope',
        );
    });

    it('filtra por rol y por texto, y pagina', async () => {
        const { asker } = await pastor('pastor@navis.app', 'Norte');
        await gateway.createUser(asker, alta());
        await gateway.createUser(asker, alta({ name: 'Luis', email: 'luis@navis.app' }));
        await gateway.createUser(
            asker,
            alta({ name: 'Marta', email: 'marta@navis.app', role: 'creyente' }),
        );
        expect((await users(asker, { role: 'creyente' })).items.map((one) => one.name)).toEqual([
            'Marta',
        ]);
        expect((await users(asker, { search: 'LUIS' })).total).toBe(1);
        const page = await users(asker, { limit: 2, page: 2, sort: 'name', order: 'asc' });
        expect(page).toMatchObject({ total: 4, totalPages: 2 });
        expect(page.items).toHaveLength(2);
    });

    it('cambia el rol y la contraseña de una cuenta', async () => {
        const { asker } = await pastor('pastor@navis.app', 'Norte');
        const ana = await gateway.createUser(asker, alta());
        expect((await gateway.updateUser(asker, ana.id, { role: 'sonido' })).role).toBe('sonido');
        await gateway.setPassword(asker, ana.id, 'OtraClave456');
        expect(await login({ email: 'ana@navis.app', password: PASSWORD })).toEqual({
            error: 'wrong-password',
        });
        expect(await login({ email: 'ana@navis.app', password: 'OtraClave456' })).toHaveProperty(
            'user',
        );
    });

    describe('roles', () => {
        async function superadmin() {
            const base = await pastor('super@navis.app', 'Central');
            const db = await getDb();
            await db.runAsync(
                "UPDATE local_user SET role = 'superadmin' WHERE id = ?",
                base.asker.userId,
            );
            return base.asker;
        }
        const nuevo = { name: 'Tesorería', level: 1, permissions: [] as never[] };

        it('el pastor no administra el catálogo; el superadmin sí', async () => {
            const { asker } = await pastor('pastor@navis.app', 'Norte');
            expect(await codeOf(gateway.createRole(asker, nuevo))).toBe('forbidden-permission');
            const admin = await superadmin();
            expect((await gateway.createRole(admin, nuevo)).slug).toBe('tesoreria');
            expect(await codeOf(gateway.createRole(admin, nuevo))).toBe('name-taken');
        });

        it('protege los de serie, el superadmin y los que tienen cuentas', async () => {
            const admin = await superadmin();
            const all = await gateway.listRoles(admin, rolesQuerySchema.parse({ limit: 100 }));
            const bySlug = (slug: string) => all.items.find((one) => one.slug === slug)!;
            expect(await codeOf(gateway.updateRole(admin, bySlug('pastor').id, { level: 1 }))).toBe(
                'role-locked',
            );
            expect(
                await codeOf(
                    gateway.updateRole(admin, bySlug('superadmin').id, { permissions: [] }),
                ),
            ).toBe('role-locked');
            expect(await codeOf(gateway.removeRole(admin, bySlug('pastor').id))).toBe(
                'role-locked',
            );

            const propio = await gateway.createRole(admin, nuevo);
            await gateway.createUser(admin, alta({ role: propio.slug }));
            expect(await codeOf(gateway.removeRole(admin, propio.id))).toBe('role-in-use');
        });
    });

    describe('baja de una cuenta', () => {
        it('no quita al último superadmin', async () => {
            const norte = await pastor('norte@navis.app', 'Norte');
            const db = await getDb();
            const jefe = await createAccount({
                name: 'Jefe',
                email: 'jefe@navis.app',
                password: PASSWORD,
            });
            if ('error' in jefe) throw new Error(jefe.error);
            await db.runAsync(
                "UPDATE local_user SET role = 'superadmin' WHERE id = ?",
                jefe.user.id,
            );
            // Comparten iglesia, para que quien pregunta tenga alcance sobre él.
            await db.runAsync(
                'INSERT INTO church_members (id, church_id, user_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
                'm1',
                norte.church.id,
                jefe.user.id,
                '2026-01-01',
                '2026-01-01',
            );
            expect(await codeOf(gateway.removeUser(norte.asker, jefe.user.id))).toBe('last-admin');
        });

        it('exige decidir qué pasa con las iglesias propias y respeta la decisión', async () => {
            const norte = await pastor('norte@navis.app', 'Norte');
            const db = await getDb();
            const jefe = await createAccount({
                name: 'Jefe',
                email: 'jefe@navis.app',
                password: PASSWORD,
            });
            if ('error' in jefe) throw new Error(jefe.error);
            const sede = await createChurch({ name: 'Sede', city: '', ownerId: jefe.user.id });
            // Comparten la iglesia del pastor que pregunta, para tener alcance sobre él.
            await db.runAsync(
                'INSERT INTO church_members (id, church_id, user_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
                'm1',
                norte.church.id,
                jefe.user.id,
                '2026-01-01',
                '2026-01-01',
            );

            const error = await gateway
                .removeUser(norte.asker, jefe.user.id)
                .catch((e: unknown) => e);
            expect(error).toBeInstanceOf(UsersError);
            expect((error as UsersError).code).toBe('owns-churches');
            expect((error as UsersError).data?.ownedChurches[0]).toMatchObject({ id: sede.id });

            expect(
                await codeOf(
                    gateway.removeUser(norte.asker, jefe.user.id, [
                        { churchId: sede.id, action: 'transfer', targetChurchId: norte.church.id },
                    ]),
                ),
            ).toBe('transfer-unsupported');

            await gateway.removeUser(norte.asker, jefe.user.id, [
                { churchId: sede.id, action: 'delete' },
            ]);
            expect(
                await db.getFirstAsync('SELECT id FROM local_user WHERE id = ?', jefe.user.id),
            ).toBeNull();
            const gone = await db.getFirstAsync<{ deleted_at: string | null }>(
                'SELECT deleted_at FROM churches WHERE id = ?',
                sede.id,
            );
            expect(gone?.deleted_at).not.toBeNull();
        });
    });
});
