import { setupLocalDb } from '@/data/test-support';
import { getDb, setDbForTests } from '@/data/db';
import { openDatabaseAsync } from 'expo-sqlite';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';

import { createAccount } from '@/data/repos/account-repo';
import { createChurch } from '@/data/repos/church-repo';
import { createList } from '@/data/repos/lists-repo';
import { createListViewer } from '@/data/repos/list-viewers-writes';
import { readListViewers } from '@/data/repos/list-viewers-reads';
import { updateListViewer } from '@/data/repos/list-viewers-settings';
import { localUsersGateway as gateway } from '@/data/users/local-users-gateway';
import { migrateUsersRoles } from '@/data/users-roles-migration';
import { useLocalSession } from '@/stores/local-session';
import { AccessDetailScreen } from './access-detail-screen';
import { AccessDirectory } from './access-directory';
import { UsersScreen } from './users-screen';

jest.mock('expo-sqlite', () => ({ __esModule: true, openDatabaseAsync: jest.fn() }));
jest.mock('expo-router', () => ({
    router: { push: jest.fn(), back: jest.fn(), replace: jest.fn() },
}));

const PASSWORD = 'abcd-efgh-jkmn';

/** Los accesos de lectura de la iglesia, recorridos por la interfaz contra SQLite real. */
describe('accesos de lectura: flujos de la interfaz', () => {
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

    /** Un pastor dueño de su iglesia, con dos listas y un acceso «Ancianos» que abre la primera. */
    async function seed() {
        const owner = await createAccount({
            name: 'Pablo Pastor',
            email: 'pablo@navis.app',
            password: 'MuySegura123',
        });
        if ('error' in owner) throw new Error(owner.error);
        const church = await createChurch({ name: 'Norte', city: '', ownerId: owner.user.id });
        const context = { userId: owner.user.id, churchId: church.id };
        const ancianos = await createList(context, { name: 'Ancianos' });
        const jovenes = await createList(context, { name: 'Jóvenes' });
        await createListViewer(context, {
            label: 'Consejo',
            username: 'consejo',
            password: PASSWORD,
            listIds: [ancianos],
        });
        await act(() => {
            useLocalSession.getState().setSession(context);
        });
        const viewer = (await readListViewers(context))[0];
        return { context, church, ancianos, jovenes, viewer };
    }

    const inApp = (children: React.ReactNode) =>
        render(
            <QueryClientProvider
                client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
            >
                {children}
            </QueryClientProvider>,
        );

    async function grantsOf(viewerId: string): Promise<string[]> {
        const rows = await (
            await getDb()
        ).getAllAsync<{ list_id: string }>(
            'SELECT list_id FROM list_grants WHERE viewer_id = ?',
            viewerId,
        );
        return rows.map((row) => row.list_id);
    }

    it('lista los accesos con su estado, su última entrada y una píldora por cada lista que abren', async () => {
        const { context } = await seed();
        await createListViewer(context, {
            label: 'Tesoreros',
            username: 'tesoreros',
            password: PASSWORD,
        });
        const all = await readListViewers(context);
        await updateListViewer(context, all.find((one) => one.username === 'tesoreros')!.id, {
            isActive: false,
        });
        await inApp(<AccessDirectory />);

        expect(await screen.findByTestId('access-card-consejo')).toBeTruthy();
        expect(screen.getByTestId('access-card-tesoreros')).toBeTruthy();
        expect(screen.getAllByText('Activo').length).toBeGreaterThan(0);
        expect(screen.getByText('Desactivado')).toBeTruthy();
        expect(screen.getAllByText(/Nunca ha entrado/).length).toBe(2);
        expect(screen.getByText('Ancianos')).toBeTruthy();
        expect(screen.getByText('Sin listas')).toBeTruthy();
        expect(screen.getByText('2')).toBeTruthy();
    });

    it('un acceso caducado se ve caducado, y se busca por etiqueta, usuario o creyente', async () => {
        const { context, viewer } = await seed();
        await updateListViewer(context, viewer.id, { expiresAt: '2020-01-01T23:59:59.999Z' });
        await inApp(<AccessDirectory />);
        expect(await screen.findByText('Caducado')).toBeTruthy();

        await fireEvent.changeText(screen.getByTestId('access-search'), 'zzz');
        expect(await screen.findByText('Ningún acceso coincide con la búsqueda.')).toBeTruthy();
        await fireEvent.changeText(screen.getByTestId('access-search'), 'CONSE');
        expect(await screen.findByTestId('access-card-consejo')).toBeTruthy();
    });

    it('sin accesos, el vacío invita a crear el primero', async () => {
        const { context, viewer } = await seed();
        await updateListViewer(context, viewer.id, { isActive: false });
        const db = await getDb();
        await db.runAsync('UPDATE list_viewers SET deleted_at = ?', '2026-01-01');
        await inApp(<AccessDirectory />);
        expect(await screen.findByText('Todavía no hay ningún acceso')).toBeTruthy();
        expect(screen.getByTestId('access-add')).toBeTruthy();
    });

    it('crea un acceso de grupo desde el botón, enseña su contraseña una vez y lo muestra en la lista', async () => {
        await seed();
        await inApp(<AccessDirectory />);
        await fireEvent.press(await screen.findByTestId('access-add'));
        await fireEvent.press(await screen.findByText('De un grupo'));
        await fireEvent.changeText(screen.getByTestId('viewer-label'), 'Diaconos');
        await fireEvent.press(screen.getByTestId('viewer-create'));

        expect(await screen.findByText('Cópiala ahora: no vas a volver a verla.')).toBeTruthy();
        await fireEvent.press(screen.getByTestId('viewer-done'));
        expect(await screen.findByTestId('access-card-diaconos')).toBeTruthy();
        expect(screen.queryByTestId('viewer-done')).toBeNull();
    });

    // Regresión del repaso en emulador: la X de la hoja también tiene que cerrarla tras crear, no solo el botón.
    it('la X de la hoja cierra el formulario después de crear el acceso', async () => {
        await seed();
        await inApp(<AccessDirectory />);
        await fireEvent.press(await screen.findByTestId('access-add'));
        await fireEvent.press(await screen.findByText('De un grupo'));
        await fireEvent.changeText(screen.getByTestId('viewer-label'), 'Visitas');
        await fireEvent.press(screen.getByTestId('viewer-create'));
        await screen.findByTestId('viewer-done');
        const [cross] = screen.getAllByRole('button', { name: 'Cerrar' });
        await fireEvent.press(cross);
        await waitFor(() => expect(screen.queryByTestId('viewer-done')).toBeNull());
        expect(await screen.findByTestId('access-card-visitas')).toBeTruthy();
    });

    it('la ficha cambia a qué listas llega el acceso, y lo guarda', async () => {
        const { viewer, ancianos, jovenes } = await seed();
        await inApp(<AccessDetailScreen id={viewer.id} />);
        expect((await screen.findAllByText('Consejo')).length).toBeGreaterThan(0);
        await fireEvent.press(screen.getByTestId('access-lists'));
        await fireEvent.press(await screen.findByRole('checkbox', { name: 'Jóvenes' }));
        await waitFor(async () =>
            expect((await grantsOf(viewer.id)).sort()).toEqual([ancianos, jovenes].sort()),
        );
        await fireEvent.press(screen.getByRole('checkbox', { name: 'Ancianos' }));
        await waitFor(async () => expect(await grantsOf(viewer.id)).toEqual([jovenes]));
        await fireEvent.press(screen.getByTestId('access-lists-done'));
        expect(screen.queryByTestId('access-lists-done')).toBeNull();
    });

    it('edita el nombre y la caducidad desde su hoja', async () => {
        const { context, viewer } = await seed();
        await inApp(<AccessDetailScreen id={viewer.id} />);
        await fireEvent.press(await screen.findByTestId('access-edit'));
        await fireEvent.changeText(screen.getByTestId('access-label'), 'Consejo de ancianos');
        await fireEvent.changeText(screen.getByTestId('access-expires'), '2030-01-01');
        await fireEvent.press(screen.getByTestId('access-save'));

        await waitFor(() => expect(screen.queryByTestId('access-save')).toBeNull());
        expect((await screen.findAllByText('Consejo de ancianos')).length).toBeGreaterThan(0);
        const saved = (await readListViewers(context))[0];
        expect(saved.label).toBe('Consejo de ancianos');
        expect(saved.expiresAt?.slice(0, 10)).toBe('2030-01-01');
    });

    it('regenera la contraseña, la enseña una sola vez y la anterior deja de valer', async () => {
        const { viewer } = await seed();
        const db = await getDb();
        const before = await db.getFirstAsync<{ password_hash: string }>(
            'SELECT password_hash FROM list_viewers WHERE id = ?',
            viewer.id,
        );
        await inApp(<AccessDetailScreen id={viewer.id} />);
        await fireEvent.press(await screen.findByTestId('access-password'));
        expect(await screen.findByText('Cópiala ahora: no vas a volver a verla.')).toBeTruthy();
        const after = await db.getFirstAsync<{ password_hash: string }>(
            'SELECT password_hash FROM list_viewers WHERE id = ?',
            viewer.id,
        );
        expect(after?.password_hash).not.toBe(before?.password_hash);
        await fireEvent.press(screen.getByTestId('access-credentials-done'));
        expect(screen.queryByText('Cópiala ahora: no vas a volver a verla.')).toBeNull();
    });

    it('desactivar el acceso cambia su estado a la vista', async () => {
        const { viewer } = await seed();
        await inApp(<AccessDetailScreen id={viewer.id} />);
        await fireEvent.press(await screen.findByRole('switch', { name: 'Activo' }));
        expect(await screen.findByText('Desactivado')).toBeTruthy();
    });

    it('revoca el acceso solo tras confirmarlo, y vuelve atrás', async () => {
        const { viewer } = await seed();
        await inApp(<AccessDetailScreen id={viewer.id} />);
        await fireEvent.press(await screen.findByTestId('access-revoke'));
        expect(router.back).not.toHaveBeenCalled();
        await fireEvent.press(await screen.findByTestId('access-revoke-confirm'));
        await waitFor(() => expect(router.back).toHaveBeenCalledTimes(1));
        const row = await (
            await getDb()
        ).getFirstAsync<{ deleted_at: string | null }>(
            'SELECT deleted_at FROM list_viewers WHERE id = ?',
            viewer.id,
        );
        expect(row?.deleted_at).not.toBeNull();
        expect(await grantsOf(viewer.id)).toEqual([]);
    });

    // Regresión de permisos: la pestaña la ve quien comparte listas y es dueño de la iglesia, y nadie más.
    it('la pestaña Accesos sale al pastor dueño y no a quien no puede compartir listas', async () => {
        const { context } = await seed();
        const view = await inApp(<UsersScreen />);
        expect(await screen.findByText('Accesos')).toBeTruthy();
        await view.unmount();

        const recepcion = await gateway.createUser(context, {
            name: 'Rita Puerta',
            email: 'rita@navis.app',
            password: 'MuySegura123',
            role: 'recepcion',
        });
        await act(() => {
            useLocalSession
                .getState()
                .setSession({ userId: recepcion.id, churchId: context.churchId });
        });
        await inApp(<UsersScreen />);
        expect(await screen.findByText('Roles')).toBeTruthy();
        expect(screen.queryByText('Accesos')).toBeNull();
    });
});
