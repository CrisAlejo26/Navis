import { setupLocalDb } from '@/data/test-support';
import { getDb, setDbForTests } from '@/data/db';
import { openDatabaseAsync } from 'expo-sqlite';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react-native';
import { router } from 'expo-router';

import { createAccount } from '@/data/repos/account-repo';
import { createChurch } from '@/data/repos/church-repo';
import { localUsersGateway as gateway } from '@/data/users/local-users-gateway';
import type { Asker } from '@/data/users/users-gateway';
import { migrateUsersRoles } from '@/data/users-roles-migration';
import { useLocalSession } from '@/stores/local-session';
import { RoleDetailScreen } from './role-detail-screen';
import { RolesDirectory } from './roles-directory';
import { UsersScreen } from './users-screen';

jest.mock('expo-sqlite', () => ({ __esModule: true, openDatabaseAsync: jest.fn() }));
jest.mock('expo-router', () => ({
    router: { push: jest.fn(), back: jest.fn(), replace: jest.fn() },
}));

/** La pestaña de roles recorrida por la interfaz, contra SQLite real. */
describe('roles: flujos de la interfaz', () => {
    let fixture: Awaited<ReturnType<typeof setupLocalDb>>;
    beforeAll(async () => {
        fixture = await setupLocalDb({ setDbForTests, openDatabaseMock: openDatabaseAsync });
    });
    beforeEach(async () => {
        jest.clearAllMocks();
        await fixture.clear();
        await migrateUsersRoles(await getDb());
    });
    afterAll(() => fixture.close());

    /** Entra como pastor, o como superadministrador (el único con `roles.manage`). */
    async function signIn(superadmin: boolean): Promise<Asker> {
        const owner = await createAccount({
            name: 'Pablo Pastor',
            email: 'pablo@navis.app',
            password: 'MuySegura123',
        });
        if ('error' in owner) throw new Error(owner.error);
        const church = await createChurch({ name: 'Norte', city: '', ownerId: owner.user.id });
        if (superadmin)
            await (
                await getDb()
            ).runAsync("UPDATE local_user SET role = 'superadmin' WHERE id = ?", owner.user.id);
        const asker = { userId: owner.user.id, churchId: church.id };
        await act(() => {
            useLocalSession.getState().setSession(asker);
        });
        return asker;
    }

    const inApp = (children: React.ReactNode) =>
        render(
            <QueryClientProvider
                client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
            >
                {children}
            </QueryClientProvider>,
        );

    async function roleId(asker: Asker, slug: string): Promise<string> {
        const all = await gateway.listRoles(asker, {
            page: 1,
            limit: 100,
            sort: 'level',
            order: 'asc',
        });
        const found = all.items.find((one) => one.slug === slug);
        if (!found) throw new Error(slug);
        return found.id;
    }

    async function createTesoreria(asker: Asker) {
        return gateway.createRole(asker, {
            name: 'Tesorería',
            level: 1,
            permissions: ['lists.view'],
        });
    }

    it('lista los roles de más a menos alcance, con su tipo, nivel y cuentas, y los busca por su nombre', async () => {
        await signIn(false);
        await inApp(<RolesDirectory />);
        expect(await screen.findByTestId('role-card-superadmin')).toBeTruthy();
        expect(screen.getByText('Superadministrador')).toBeTruthy();
        expect(screen.getByText('Predicador de apoyo')).toBeTruthy();
        const labels = screen
            .getAllByTestId(/role-card-/)
            .map((card) => card.props.testID as string);
        expect(labels[0]).toBe('role-card-superadmin');
        expect(labels[1]).toBe('role-card-pastor');
        expect(labels[labels.length - 1]).toBe('role-card-creyente');
        expect(screen.queryByTestId('roles-add')).toBeNull();

        await fireEvent.changeText(screen.getByTestId('roles-search'), 'púlpito');
        await waitFor(() => expect(screen.queryByTestId('role-card-pastor')).toBeNull());
        expect(screen.getByTestId('role-card-pulpito')).toBeTruthy();
        await fireEvent.changeText(screen.getByTestId('roles-search'), 'zzz');
        expect(await screen.findByText('Ningún rol coincide con la búsqueda.')).toBeTruthy();
    });

    it('abre la ficha de un rol al pulsarlo', async () => {
        const asker = await signIn(false);
        await inApp(<RolesDirectory />);
        await fireEvent.press(await screen.findByTestId('role-card-sonido'));
        expect(router.push).toHaveBeenCalledWith(`/users/roles/${await roleId(asker, 'sonido')}`);
    });

    it('crea un rol propio: valida el nombre, marca permisos y lo muestra en la lista', async () => {
        const asker = await signIn(true);
        await inApp(<RolesDirectory />);
        await fireEvent.press(await screen.findByTestId('roles-add'));

        await fireEvent.press(await screen.findByTestId('role-save'));
        expect(await screen.findByText('Escribe el nombre del rol (2 letras o más)')).toBeTruthy();

        await fireEvent.changeText(screen.getByTestId('role-name'), 'Tesorería');
        await fireEvent.changeText(screen.getByTestId('role-description'), 'Lleva las cuentas');
        const lists = within(screen.getByTestId('permission-lists'));
        await fireEvent.press(lists.getByText('Ver'));
        await fireEvent.press(lists.getByText('Publicar'));
        await fireEvent.press(screen.getByTestId('role-save'));

        expect(await screen.findByTestId('role-card-tesoreria')).toBeTruthy();
        expect(screen.queryByTestId('role-save')).toBeNull();
        const created = (
            await gateway.listRoles(asker, { page: 1, limit: 100, sort: 'level', order: 'asc' })
        ).items.find((one) => one.slug === 'tesoreria');
        expect(created).toMatchObject({
            name: 'Tesorería',
            description: 'Lleva las cuentas',
            isSystem: false,
        });
        expect(created?.permissions.sort()).toEqual(['lists.share', 'lists.view']);
    });

    it('avisa de un nombre ya usado sin cerrar el formulario', async () => {
        const asker = await signIn(true);
        await createTesoreria(asker);
        await inApp(<RolesDirectory />);
        await fireEvent.press(await screen.findByTestId('roles-add'));
        await fireEvent.changeText(screen.getByTestId('role-name'), 'Tesorería');
        await fireEvent.press(screen.getByTestId('role-save'));
        expect(await screen.findByText('Ya hay un rol con ese nombre')).toBeTruthy();
        expect(screen.getByTestId('role-save')).toBeTruthy();
    });

    it('la ficha de un rol propio resume sus permisos por módulo y permite editarlos', async () => {
        const asker = await signIn(true);
        const role = await createTesoreria(asker);
        await inApp(<RoleDetailScreen id={role.id} />);
        const summary = await screen.findByTestId('summary-lists');
        expect(within(summary).getByText('Ver')).toBeTruthy();
        expect(within(summary).queryByText('Gestionar')).toBeNull();

        await fireEvent.press(screen.getByTestId('role-edit'));
        await fireEvent.changeText(await screen.findByTestId('role-name'), 'Tesorería y ofrendas');
        await fireEvent.press(
            within(screen.getByTestId('permission-lists')).getByText('Gestionar'),
        );
        await fireEvent.press(screen.getByTestId('role-save'));

        await waitFor(() => expect(screen.queryByTestId('role-save')).toBeNull());
        expect(
            within(await screen.findByTestId('summary-lists')).getByText('Gestionar'),
        ).toBeTruthy();
        expect((await screen.findAllByText('Tesorería y ofrendas')).length).toBeGreaterThan(0);
    });

    it('borra un rol propio sin cuentas tras confirmarlo y vuelve atrás', async () => {
        const asker = await signIn(true);
        const role = await createTesoreria(asker);
        await inApp(<RoleDetailScreen id={role.id} />);
        await fireEvent.press(await screen.findByTestId('role-delete'));
        expect(await screen.findByText('¿Eliminar el rol Tesorería?')).toBeTruthy();
        await fireEvent.press(screen.getByTestId('role-delete-confirm'));
        await waitFor(() => expect(router.back).toHaveBeenCalledTimes(1));
        const db = await getDb();
        const row = await db.getFirstAsync<{ deleted_at: string | null }>(
            'SELECT deleted_at FROM roles WHERE id = ?',
            role.id,
        );
        expect(row?.deleted_at).not.toBeNull();
    });

    it('un rol con cuentas no se puede borrar y la ficha dice por qué', async () => {
        const asker = await signIn(true);
        const role = await createTesoreria(asker);
        await gateway.createUser(asker, {
            name: 'Tere Caja',
            email: 'tere@navis.app',
            password: 'MuySegura123',
            role: role.slug,
        });
        await inApp(<RoleDetailScreen id={role.id} />);
        const button = await screen.findByTestId('role-delete');
        // Pulsarlo no abre la confirmación: el botón está desactivado, no solo gris.
        await fireEvent.press(button);
        expect(screen.queryByText('¿Eliminar el rol Tesorería?')).toBeNull();
        expect(
            screen.getByText('Hay cuentas con ese rol: cámbialas antes de borrarlo'),
        ).toBeTruthy();
    });

    it('en un rol de serie solo se editan descripción y permisos, y el superadministrador no se toca', async () => {
        const asker = await signIn(true);
        await inApp(<RoleDetailScreen id={await roleId(asker, 'recepcion')} />);
        expect(screen.queryByTestId('role-delete')).toBeNull();
        await fireEvent.press(await screen.findByTestId('role-edit'));
        expect(
            await screen.findByText('De un rol de serie se cambian la descripción y los permisos'),
        ).toBeTruthy();
        expect(screen.queryByTestId('role-name')).toBeNull();
        await fireEvent.press(
            within(await screen.findByTestId('permission-lists')).getByText('Publicar'),
        );
        await fireEvent.press(screen.getByTestId('role-save'));
        await waitFor(() => expect(screen.queryByTestId('role-save')).toBeNull());
        const saved = (
            await gateway.listRoles(asker, { page: 1, limit: 100, sort: 'level', order: 'asc' })
        ).items.find((one) => one.slug === 'recepcion');
        expect(saved?.permissions).toContain('lists.share');
        expect(saved?.permissions).toContain('lists.manage'); // lo que ya tenía se conserva
    });

    it('el superadministrador se ve entero y su formulario no ofrece permisos', async () => {
        const asker = await signIn(true);
        await inApp(<RoleDetailScreen id={await roleId(asker, 'superadmin')} />);
        expect(
            (await screen.findAllByText('El superadministrador lo ve todo, y eso no se cambia.'))
                .length,
        ).toBe(1);
        await fireEvent.press(screen.getByTestId('role-edit'));
        expect(
            (await screen.findAllByText('El superadministrador lo ve todo, y eso no se cambia.'))
                .length,
        ).toBe(2);
        expect(screen.queryByTestId('permission-lists')).toBeNull();
    });

    // Regresión de permisos: solo quien tiene `roles.manage` ve las acciones; el pastor, no.
    it('sin roles.manage la ficha de un rol no ofrece acciones', async () => {
        const asker = await signIn(false);
        await inApp(<RoleDetailScreen id={await roleId(asker, 'sonido')} />);
        expect((await screen.findAllByText('Sonido')).length).toBeGreaterThan(0);
        expect(screen.queryByTestId('role-edit')).toBeNull();
        expect(screen.queryByTestId('role-delete')).toBeNull();
    });

    it('las pestañas cambian entre usuarios y roles sin perder la barra', async () => {
        await signIn(false);
        await inApp(<UsersScreen />);
        expect((await screen.findAllByText('Pablo Pastor')).length).toBeGreaterThan(0);
        await fireEvent.press(screen.getByText('Roles'));
        expect(await screen.findByTestId('role-card-pastor')).toBeTruthy();
        await fireEvent.press(screen.getByText('Usuarios'));
        expect((await screen.findAllByText('Pablo Pastor')).length).toBeGreaterThan(0);
    });
});
