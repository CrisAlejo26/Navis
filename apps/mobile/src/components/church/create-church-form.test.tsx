import { isolationSuite } from '@/data/test-support/church-isolation-suite';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CreateChurchForm } from './create-church-form';
import { listMyChurches, resolveActiveChurch } from '@/data/repos/church-access';
import { getDb } from '@/data/db';
import { useLocalSession } from '@/stores/local-session';
import { ISOLATION_OWNER } from '@/data/test-support/seed-two-churches';

jest.mock('expo-router', () => ({
    router: { canDismiss: jest.fn(() => true), dismissAll: jest.fn(), replace: jest.fn() },
}));
jest.mock('@/lib/notifications/sync', () => ({
    syncNotifications: jest.fn(() => Promise.resolve()),
}));
jest.mock('@/lib/church-changed-notice', () => ({ showChurchChanged: jest.fn() }));
jest.mock('@/lib/geo/device-country', () => ({ deviceCountry: () => 'CO' }));
const suite = isolationSuite();
// Crear otra iglesia mantiene las anteriores y activa la nueva con su país y siembra.
it('crea desde el formulario una tercera iglesia, con nombre repetido', async () => {
    const { north } = suite.churches();
    const before = useLocalSession.getState().session;
    const db = await getDb();
    await db.runAsync(
        'INSERT INTO local_user (id, name, email, password_hash, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
        ISOLATION_OWNER,
        'Owner',
        'form@navis.app',
        'hash',
        '2026-10-01',
        '2026-10-01',
    );
    useLocalSession.getState().setSession({ userId: ISOLATION_OWNER, churchId: north.churchId });
    const client = new QueryClient({
        defaultOptions: {
            queries: { retry: false, gcTime: Infinity },
            mutations: { gcTime: Infinity },
        },
    });
    const { unmount } = await render(
        <QueryClientProvider client={client}>
            <CreateChurchForm />
        </QueryClientProvider>,
    );
    try {
        expect(screen.getByRole('button', { name: 'Crear iglesia' })).toBeDisabled();
        await fireEvent.changeText(screen.getByLabelText('Nombre de la iglesia'), ' N-Iglesia ');
        await fireEvent.changeText(screen.getByLabelText('Ciudad'), ' Bogotá ');
        await fireEvent.press(screen.getByRole('button', { name: 'Crear iglesia' }));
        await waitFor(() =>
            expect(useLocalSession.getState().session?.churchId).not.toBe(north.churchId),
        );
        const churches = await listMyChurches(ISOLATION_OWNER);
        expect(churches).toHaveLength(3);
        const active = await resolveActiveChurch(ISOLATION_OWNER);
        expect(active).toMatchObject({ name: 'N-Iglesia', city: 'Bogotá', country: 'CO' });
        expect(churches.filter((c) => c.name === 'N-Iglesia').map((c) => c.slug)).toEqual(
            expect.arrayContaining(['n-iglesia', 'n-iglesia-2']),
        );
        const seeded = await db.getFirstAsync<{ total: number }>(
            'SELECT COUNT(*) AS total FROM calendars WHERE church_id = ?',
            active!.id,
        );
        expect(seeded?.total).toBe(4);
        expect(
            await db.getFirstAsync<{ total: number }>(
                'SELECT COUNT(*) AS total FROM believers WHERE church_id = ?',
                active!.id,
            ),
        ).toEqual({ total: 0 });
    } finally {
        await unmount();
        await client.cancelQueries();
        client.clear();
        useLocalSession.setState({ session: before });
    }
});
