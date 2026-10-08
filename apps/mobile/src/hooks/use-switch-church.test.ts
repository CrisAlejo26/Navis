import { isolationSuite } from '../data/test-support/church-isolation-suite';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement, type ReactNode } from 'react';
import { router } from 'expo-router';
import { getDb } from '@/data/db';
import { useSwitchChurch } from './use-switch-church';
import { useNoteCounts } from './use-believers';
import { useLocalSession } from '@/stores/local-session';
import { useActiveCalendarStore } from '@/lib/calendar/active-calendar';
import { syncNotifications } from '@/lib/notifications/sync';
import { showChurchChanged } from '@/lib/church-changed-notice';
import { ISOLATION_OWNER } from '../data/test-support/seed-two-churches';

jest.mock('expo-router', () => ({
    router: { canDismiss: jest.fn(() => false), dismissAll: jest.fn(), replace: jest.fn() },
}));
jest.mock('@/lib/notifications/sync', () => ({
    syncNotifications: jest.fn(() => Promise.resolve()),
}));
jest.mock('@/lib/church-changed-notice', () => ({ showChurchChanged: jest.fn() }));
const suite = isolationSuite();
// I4–I6: cambio real con SQLite, observadores activos y una respuesta vieja en vuelo.
it('persiste, reinicia el calendario, vuelve a Inicio y excluye datos anteriores', async () => {
    const { north, south } = suite.churches();
    const before = useLocalSession.getState().session;
    const db = await getDb();
    await db.runAsync(
        'INSERT INTO local_user (id, name, email, password_hash, created_at, updated_at, active_church_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
        ISOLATION_OWNER,
        'Owner',
        'switch@navis.app',
        'hash',
        '2026-10-01',
        '2026-10-01',
        north.churchId,
    );
    useLocalSession.getState().setSession({ userId: ISOLATION_OWNER, churchId: north.churchId });
    useActiveCalendarStore.setState({ calendarId: north.calendarId, anchor: '2026-09-01' });
    const client = new QueryClient({
        defaultOptions: {
            queries: { retry: false, gcTime: Infinity },
            mutations: { gcTime: Infinity },
        },
    });
    client.setQueryData(['church', north.churchId], 'N-church');
    client.setQueryData(['demo-data', north.churchId], 'N-demo');
    const taskKeys = [
        'local-tasks',
        'local-habits',
        'local-task-tags',
        'local-workflows',
        'local-task-time',
        'local-activities',
    ].map((prefix) => [prefix, north.churchId, ISOLATION_OWNER]);
    for (const key of taskKeys) client.setQueryData(key, ['private']);
    client.setQueryData(['prophecies', ISOLATION_OWNER], ['personal']);
    let release: (data: string) => void = () => undefined;
    const late = client
        .fetchQuery({
            queryKey: ['calendar', north.churchId, 'late'],
            queryFn: () =>
                new Promise<string>((done) => {
                    release = done;
                }),
        })
        .catch(() => undefined);
    const wrapper = ({ children }: { children: ReactNode }) =>
        createElement(QueryClientProvider, { client }, children);
    const { result, unmount } = await renderHook(
        () => ({ change: useSwitchChurch(), counts: useNoteCounts(north.believerId) }),
        { wrapper },
    );
    try {
        await waitFor(() => expect(result.current.counts.data?.total).toBe(1));
        await act(async () => {
            await result.current.change.switchChurch(south.churchId);
        });
        expect(
            await db.getFirstAsync(
                'SELECT active_church_id FROM local_user WHERE id = ?',
                ISOLATION_OWNER,
            ),
        ).toEqual({ active_church_id: south.churchId });
        expect(useLocalSession.getState().session?.churchId).toBe(south.churchId);
        expect(useActiveCalendarStore.getState()).toMatchObject({ calendarId: null, anchor: '' });
        await waitFor(() => expect(result.current.counts.data?.total).toBe(0));
        release('N-response');
        await late;
        expect(client.getQueryData(['calendar', north.churchId, 'late'])).toBeUndefined();
        expect(client.getQueryData(['church', north.churchId])).toBeUndefined();
        expect(client.getQueryData(['demo-data', north.churchId])).toBeUndefined();
        for (const key of taskKeys) expect(client.getQueryData(key)).toBeUndefined();
        expect(client.getQueryData(['prophecies', ISOLATION_OWNER])).toEqual(['personal']);
        expect(router.dismissAll).not.toHaveBeenCalled();
        expect(router.replace).toHaveBeenCalledWith('/(tabs)');
        expect(syncNotifications).toHaveBeenCalled();
        expect(showChurchChanged).toHaveBeenCalledWith('S-Iglesia');
    } finally {
        release('done');
        await unmount();
        client.clear();
        useLocalSession.setState({ session: before });
        useActiveCalendarStore.getState().reset();
    }
});
