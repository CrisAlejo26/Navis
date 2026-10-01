import { isolationSuite } from '../data/test-support/church-isolation-suite';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement, type ReactNode } from 'react';
import { useNoteCounts, useNoteDays } from './use-believers';
import { useLocalSession } from '@/stores/local-session';
import { ISOLATION_DAY, ISOLATION_OWNER } from '../data/test-support/seed-two-churches';

jest.mock('expo-router', () => ({ router: { replace: jest.fn() } }));
const suite = isolationSuite();
// I4: sin invalidar nada, cambiar de contexto no puede reutilizar contadores ajenos.
it('los contadores y días de notas no reutilizan el caché de la iglesia anterior', async () => {
    const { north, south } = suite.churches();
    const before = useLocalSession.getState().session;
    const client = new QueryClient({
        defaultOptions: { queries: { retry: false, gcTime: Infinity } },
    });
    const wrapper = ({ children }: { children: ReactNode }) =>
        createElement(QueryClientProvider, { client }, children);
    useLocalSession.getState().setSession({ userId: ISOLATION_OWNER, churchId: north.churchId });
    const { result, unmount } = await renderHook(
        () => ({
            counts: useNoteCounts(north.believerId),
            days: useNoteDays(north.believerId, ISOLATION_DAY, ISOLATION_DAY),
        }),
        { wrapper },
    );
    try {
        await waitFor(() => {
            expect(result.current.counts.data?.total).toBe(1);
            expect(result.current.days.data).toHaveLength(1);
        });
        await act(() => useLocalSession.getState().setChurch(south.churchId));
        await waitFor(() => {
            expect(result.current.counts.data?.total).toBe(0);
            expect(result.current.days.data).toEqual([]);
        });
        await act(() => useLocalSession.getState().setChurch(north.churchId));
        await waitFor(() => expect(result.current.counts.data?.total).toBe(1));
    } finally {
        await unmount();
        client.clear();
        useLocalSession.setState({ session: before });
    }
});
