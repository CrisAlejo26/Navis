import { setupLocalDb } from '@/data/test-support';
import { getDb, setDbForTests } from '@/data/db';
import { openDatabaseAsync } from 'expo-sqlite';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';

import { createAccount, login } from '@/data/repos/account-repo';
import { createChurch } from '@/data/repos/church-repo';
import { localUsersGateway as gateway } from '@/data/users/local-users-gateway';
import type { Asker } from '@/data/users/users-gateway';
import { migrateUsersRoles } from '@/data/users-roles-migration';
import { useLocalSession } from '@/stores/local-session';
import { UserDetailScreen } from './user-detail-screen';
import { UsersDirectory } from './users-directory';

jest.mock('expo-sqlite', () => ({ __esModule: true, openDatabaseAsync: jest.fn() }));
jest.mock('expo-router', () => ({
    router: { push: jest.fn(), back: jest.fn(), replace: jest.fn() },
}));

const PASSWORD = 'MuySegura123';

/** Los flujos de la gestión de usuarios recorridos por la interfaz, contra SQLite real. */
describe('gestión de usuarios: flujos de la interfaz', () => {
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

    async function signIn(asker: Asker) {
        await act(() => {
            useLocalSession.getState().setSession(asker);
        });
    }

    async function pastor() {
        const owner = await createAccount({
            name: 'Pablo Pastor',
            email: 'pablo@navis.app',
            password: PASSWORD,
        });
        if ('error' in owner) throw new Error(owner.error);
        const church = await createChurch({ name: 'Norte', city: '', ownerId: owner.user.id });
        const asker = { userId: owner.user.id, churchId: church.id };
        await signIn(asker);
        return { asker, church };
    }

    const client = () => new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const inApp = (children: React.ReactNode) =>
        render(<QueryClientProvider client={client()}>{children}</QueryClientProvider>);

    async function ana(asker: Asker) {
        return gateway.createUser(asker, {
            name: 'Ana García',
            email: 'ana@navis.app',
            password: PASSWORD,
            role: 'recepcion',
        });
    }

    it('da de alta una cuenta desde el botón: valida, ofrece solo los roles repartibles y la crea', async () => {
        await pastor();
        await inApp(<UsersDirectory />);
        await fireEvent.press(await screen.findByTestId('users-add'));

        await fireEvent.press(await screen.findByTestId('user-save'));
        expect(await screen.findByText('Escribe el nombre (2 letras o más)')).toBeTruthy();
        expect(screen.getByText('Escribe un correo válido')).toBeTruthy();
        expect(
            screen.getAllByText('Diez caracteres o más, con mayúscula, minúscula y número.').length,
        ).toBeGreaterThan(0);

        await fireEvent.changeText(screen.getByTestId('user-name'), 'Nora Díaz');
        await fireEvent.changeText(screen.getByTestId('user-email'), 'Nora@Navis.app');
        await fireEvent.changeText(screen.getByTestId('user-password-input'), PASSWORD);
        await fireEvent.press(screen.getByText('Elige un rol'));
        expect(screen.queryByText('Superadministrador')).toBeNull();
        expect(screen.queryByRole('button', { name: 'Pastor' })).toBeNull();
        await fireEvent.press(await screen.findByText('Recepción'));
        await fireEvent.press(screen.getByTestId('user-save'));

        expect(await screen.findByText('Nora Díaz')).toBeTruthy();
        expect(screen.queryByTestId('user-save')).toBeNull();
        expect(await login({ email: 'nora@navis.app', password: PASSWORD })).toHaveProperty('user');
    });

    it('un correo ya usado se avisa sin cerrar el formulario', async () => {
        const { asker } = await pastor();
        await ana(asker);
        await inApp(<UsersDirectory />);
        await fireEvent.press(await screen.findByTestId('users-add'));
        await fireEvent.changeText(screen.getByTestId('user-name'), 'Otra Ana');
        await fireEvent.changeText(screen.getByTestId('user-email'), 'ana@navis.app');
        await fireEvent.changeText(screen.getByTestId('user-password-input'), PASSWORD);
        await fireEvent.press(screen.getByText('Elige un rol'));
        await fireEvent.press(await screen.findByText('Sonido'));
        await fireEvent.press(screen.getByTestId('user-save'));
        expect(await screen.findByText('Ya hay una cuenta con ese correo')).toBeTruthy();
        expect(screen.getByTestId('user-save')).toBeTruthy();
    });

    it('la ficha edita el nombre, y cambiar el correo exige una contraseña nueva con la que entra', async () => {
        const { asker } = await pastor();
        const user = await ana(asker);
        await inApp(<UserDetailScreen id={user.id} />);
        await fireEvent.press(await screen.findByTestId('user-edit'));

        await fireEvent.changeText(screen.getByTestId('user-name'), 'Ana M. García');
        await fireEvent.press(screen.getByTestId('user-save'));
        await waitFor(() => expect(screen.queryByTestId('user-save')).toBeNull());
        expect((await screen.findAllByText('Ana M. García')).length).toBeGreaterThan(0);

        await fireEvent.press(screen.getByTestId('user-edit'));
        expect(screen.queryByTestId('user-password-input')).toBeNull();
        await fireEvent.changeText(screen.getByTestId('user-email'), 'ana.m@navis.app');
        expect(
            await screen.findByText(
                'Con otro correo, la contraseña actual deja de valer: pon una nueva.',
            ),
        ).toBeTruthy();
        await fireEvent.press(screen.getByTestId('user-save'));
        expect(
            await screen.findAllByText('Diez caracteres o más, con mayúscula, minúscula y número.'),
        ).toBeTruthy();
        await fireEvent.changeText(screen.getByTestId('user-password-input'), 'NuevaClave456');
        await fireEvent.press(screen.getByTestId('user-save'));
        await waitFor(() => expect(screen.queryByTestId('user-save')).toBeNull());
        expect(await login({ email: 'ana.m@navis.app', password: 'NuevaClave456' })).toHaveProperty(
            'user',
        );
    });

    it('cambia la contraseña y lo confirma en la propia hoja', async () => {
        const { asker } = await pastor();
        const user = await ana(asker);
        await inApp(<UserDetailScreen id={user.id} />);
        await fireEvent.press(await screen.findByTestId('user-password'));
        await fireEvent.changeText(screen.getByTestId('password-input'), 'corta');
        await fireEvent.press(screen.getByTestId('password-save'));
        expect(
            (
                await screen.findAllByText(
                    'Diez caracteres o más, con mayúscula, minúscula y número.',
                )
            ).length,
        ).toBeGreaterThan(1);
        await fireEvent.changeText(screen.getByTestId('password-input'), 'OtraClave456');
        await fireEvent.press(screen.getByTestId('password-save'));
        expect(await screen.findByText('Contraseña cambiada')).toBeTruthy();
        expect(await login({ email: 'ana@navis.app', password: 'OtraClave456' })).toHaveProperty(
            'user',
        );
        expect(await login({ email: 'ana@navis.app', password: PASSWORD })).toEqual({
            error: 'wrong-password',
        });
    });

    it('da de baja una cuenta tras confirmarla y vuelve atrás', async () => {
        const { asker } = await pastor();
        const user = await ana(asker);
        await inApp(<UserDetailScreen id={user.id} />);
        await fireEvent.press(await screen.findByTestId('user-delete'));
        expect(await screen.findByText('¿Eliminar la cuenta de Ana García?')).toBeTruthy();
        await fireEvent.press(screen.getByTestId('delete-user-confirm'));
        await waitFor(() => expect(router.back).toHaveBeenCalledTimes(1));
        const db = await getDb();
        expect(
            await db.getFirstAsync('SELECT id FROM local_user WHERE id = ?', user.id),
        ).toBeNull();
    });

    it('si la cuenta dirige una iglesia, enseña lo que se llevaría y la elimina solo al confirmar otra vez', async () => {
        const { asker, church } = await pastor();
        const db = await getDb();
        const jefe = await createAccount({
            name: 'Jefe',
            email: 'jefe@navis.app',
            password: PASSWORD,
        });
        if ('error' in jefe) throw new Error(jefe.error);
        const sede = await createChurch({ name: 'Sede Sur', city: '', ownerId: jefe.user.id });
        await db.runAsync(
            'INSERT INTO church_members (id, church_id, user_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
            'm1',
            church.id,
            jefe.user.id,
            '2026-01-01',
            '2026-01-01',
        );
        void asker;
        await inApp(<UserDetailScreen id={jefe.user.id} />);
        await fireEvent.press(await screen.findByTestId('user-delete'));
        await fireEvent.press(await screen.findByTestId('delete-user-confirm'));

        expect(await screen.findByText('Sede Sur')).toBeTruthy();
        expect(screen.getByText('Eliminar la cuenta y sus iglesias')).toBeTruthy();
        expect(router.back).not.toHaveBeenCalled();
        expect(
            await db.getFirstAsync('SELECT id FROM local_user WHERE id = ?', jefe.user.id),
        ).not.toBeNull();

        await fireEvent.press(screen.getByTestId('delete-user-confirm'));
        await waitFor(() => expect(router.back).toHaveBeenCalledTimes(1));
        const gone = await db.getFirstAsync<{ deleted_at: string | null }>(
            'SELECT deleted_at FROM churches WHERE id = ?',
            sede.id,
        );
        expect(gone?.deleted_at).not.toBeNull();
    });

    // Regresión de permisos: quien solo puede ver cuentas no ve ni el botón de alta ni las acciones de la ficha.
    async function viewerOnly() {
        const { asker } = await pastor();
        const db = await getDb();
        await db.runAsync("UPDATE local_user SET role = 'superadmin' WHERE id = ?", asker.userId);
        await gateway.createRole(asker, {
            name: 'Consulta',
            level: 1,
            permissions: ['users.view'],
        });
        const viewer = await gateway.createUser(asker, {
            name: 'Vera Vista',
            email: 'vera@navis.app',
            password: PASSWORD,
            role: 'consulta',
        });
        const target = await ana(asker);
        await signIn({ userId: viewer.id, churchId: asker.churchId });
        return { viewer, target };
    }

    it('sin users.manage se ven las cuentas pero no hay botón de alta', async () => {
        await viewerOnly();
        await inApp(<UsersDirectory />);
        expect(await screen.findByText('Ana García')).toBeTruthy();
        expect(screen.queryByTestId('users-add')).toBeNull();
    });

    it('sin users.manage la ficha de otra cuenta no ofrece acciones', async () => {
        const { target } = await viewerOnly();
        await inApp(<UserDetailScreen id={target.id} />);
        expect((await screen.findAllByText('Ana García')).length).toBeGreaterThan(0);
        expect(screen.queryByTestId('user-edit')).toBeNull();
        expect(screen.queryByTestId('user-delete')).toBeNull();
    });

    it('la ficha de la propia cuenta remite al perfil y no ofrece acciones', async () => {
        const { viewer } = await viewerOnly();
        await inApp(<UserDetailScreen id={viewer.id} />);
        expect((await screen.findAllByText('Vera Vista')).length).toBeGreaterThan(0);
        expect(screen.queryByTestId('user-edit')).toBeNull();
        expect(screen.getByText('Tu propia cuenta se edita desde tu perfil')).toBeTruthy();
    });
});
