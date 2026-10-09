import { setupLocalDb } from '@/data/test-support';
import { getDb, setDbForTests } from '@/data/db';
import { openDatabaseAsync } from 'expo-sqlite';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { createAccount } from '@/data/repos/account-repo';
import { createChurch } from '@/data/repos/church-repo';
import { localUsersGateway } from '@/data/users/local-users-gateway';
import { migrateUsersRoles } from '@/data/users-roles-migration';
import { useLocalSession } from '@/stores/local-session';
import { UsersDirectory } from './users-directory';

jest.mock('expo-sqlite', () => ({ __esModule: true, openDatabaseAsync: jest.fn() }));
jest.mock('expo-router', () => ({
    router: { push: jest.fn(), back: jest.fn(), replace: jest.fn() },
}));

// El recorrido completo: SQLite real → puerto → hooks → pantalla. Lo que no cubren
// las piezas sueltas es que el alcance, el filtro y el total lleguen hasta la vista.
describe('directorio de usuarios con datos reales', () => {
    let fixture: Awaited<ReturnType<typeof setupLocalDb>>;
    beforeAll(async () => {
        fixture = await setupLocalDb({ setDbForTests, openDatabaseMock: openDatabaseAsync });
    });
    beforeEach(async () => {
        await fixture.clear();
        await migrateUsersRoles(await getDb());
    });
    afterAll(() => fixture.close());

    async function seed() {
        const owner = await createAccount({
            name: 'Pablo Pastor',
            email: 'pablo@navis.app',
            password: 'MuySegura123',
        });
        if ('error' in owner) throw new Error(owner.error);
        const church = await createChurch({ name: 'Norte', city: '', ownerId: owner.user.id });
        const asker = { userId: owner.user.id, churchId: church.id };
        for (const [name, email, role] of [
            ['Ana García', 'ana@navis.app', 'recepcion'],
            ['Luis Soto', 'luis@navis.app', 'sonido'],
        ] as const)
            await localUsersGateway.createUser(asker, {
                name,
                email,
                role,
                password: 'MuySegura123',
            });
        await act(() => {
            useLocalSession.getState().setSession(asker);
        });
    }

    const open = () =>
        render(
            <QueryClientProvider
                client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
            >
                <UsersDirectory />
            </QueryClientProvider>,
        );

    it('lista las cuentas de la iglesia con su total y marca la propia', async () => {
        await seed();
        await open();
        expect(await screen.findByText('Ana García')).toBeTruthy();
        expect(screen.getByText('Luis Soto')).toBeTruthy();
        expect(screen.getByText('Pablo Pastor')).toBeTruthy();
        expect(screen.getByText('Tú')).toBeTruthy();
        expect(await screen.findByText('3')).toBeTruthy();
        expect(screen.getByText('con acceso a Norte')).toBeTruthy();
    });

    it('filtra por rol desde un chip y por texto desde el buscador', async () => {
        await seed();
        await open();
        await screen.findByText('Ana García');
        await fireEvent.press(await screen.findByText('Sonido · 1'));
        await waitFor(() => {
            expect(screen.queryByText('Ana García')).toBeNull();
            expect(screen.getByText('Luis Soto')).toBeTruthy();
        });

        await fireEvent.press(screen.getByText('Todos los roles'));
        await screen.findByText('Ana García');
        await fireEvent.changeText(screen.getByPlaceholderText('Nombre o correo'), 'zzz');
        expect(await screen.findByText('Ninguna cuenta coincide con la búsqueda.')).toBeTruthy();
        await fireEvent.press(screen.getByRole('button', { name: 'Quitar filtros' }));
        expect(await screen.findByText('Ana García')).toBeTruthy();
    });
});
