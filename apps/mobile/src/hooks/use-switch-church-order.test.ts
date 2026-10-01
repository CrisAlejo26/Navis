import { act, renderHook } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement, type ReactNode } from 'react';
import { router } from 'expo-router';
import { assertAccessible, setActiveChurch } from '@/data/repos/church-access';
import { useActiveCalendarStore } from '@/lib/calendar/active-calendar';
import { showChurchChanged } from '@/lib/church-changed-notice';
import { syncNotifications } from '@/lib/notifications/sync';
import { useLocalSession } from '@/stores/local-session';
import { useChurchTransition } from '@/stores/church-transition';
import { useSwitchChurch } from './use-switch-church';
jest.mock('expo-router', () => ({
    router: { canDismiss: jest.fn(() => true), dismissAll: jest.fn(), replace: jest.fn() },
}));
jest.mock('@/data/repos/church-access', () => ({
    assertAccessible: jest.fn(),
    setActiveChurch: jest.fn(),
}));
jest.mock('@/lib/church-changed-notice', () => ({ showChurchChanged: jest.fn() }));
jest.mock('@/lib/notifications/sync', () => ({ syncNotifications: jest.fn() }));
const church = {
    id: 'south',
    name: 'Sur',
    slug: 'sur',
    city: null,
    country: 'ES',
    timezone: 'UTC',
    ownerId: 'owner',
};
// Verifica orden y abortos; la prueba vecina verifica el efecto en SQLite real.
it.each(['ok', 'denied', 'write-failed'])('cumple la secuencia o aborta (%s)', async (outcome) => {
    const before = useLocalSession.getState().session;
    useLocalSession.getState().setSession({ userId: 'owner', churchId: 'north' });
    useActiveCalendarStore.setState({ calendarId: 'north-calendar', anchor: '2026-09-01' });
    const trace: string[] = [];
    jest.mocked(assertAccessible).mockImplementation(() => {
        trace.push('validate');
        if (outcome === 'denied') return Promise.reject(new Error('not-found'));
        return Promise.resolve(church);
    });
    jest.mocked(setActiveChurch).mockImplementation(() => {
        trace.push('persist');
        expect(useLocalSession.getState().session?.churchId).toBe('north');
        if (outcome === 'write-failed') return Promise.reject(new Error('disk-error'));
        return Promise.resolve();
    });
    const client = new QueryClient({ defaultOptions: { mutations: { gcTime: Infinity } } });
    jest.spyOn(client, 'cancelQueries').mockImplementation(() => {
        trace.push('cancel');
        return Promise.resolve();
    });
    jest.spyOn(client, 'removeQueries').mockImplementation(() => {
        trace.push('remove');
    });
    jest.spyOn(client, 'invalidateQueries').mockImplementation(() => {
        trace.push('invalidate');
        return Promise.resolve();
    });
    const unsubscribe = useLocalSession.subscribe((state, previous) => {
        if (state.session?.churchId !== previous.session?.churchId) trace.push('session');
    });
    const calendarUnsubscribe = useActiveCalendarStore.subscribe((state) => {
        if (!state.calendarId) trace.push('reset');
    });
    jest.mocked(router.dismissAll).mockImplementation(() => void trace.push('dismiss'));
    jest.mocked(router.replace).mockImplementation(() => void trace.push('replace'));
    jest.mocked(syncNotifications).mockImplementation(() => {
        trace.push('sync');
        return Promise.resolve();
    });
    jest.mocked(showChurchChanged).mockImplementation(() => void trace.push('notice'));
    const wrapper = ({ children }: { children: ReactNode }) =>
        createElement(QueryClientProvider, { client }, children);
    const { result, unmount } = await renderHook(useSwitchChurch, { wrapper });
    try {
        await act(async () => {
            if (outcome === 'ok') await result.current.switchChurch('south');
            else
                await expect(result.current.switchChurch('south')).rejects.toThrow(
                    outcome === 'denied' ? 'not-found' : 'disk-error',
                );
        });
        expect(trace.join(' ')).toBe(
            outcome === 'ok'
                ? 'validate cancel persist session reset remove invalidate dismiss replace sync notice'
                : outcome === 'denied'
                  ? 'validate'
                  : 'validate cancel persist',
        );
        expect(useChurchTransition.getState().changing).toBe(false);
        if (outcome !== 'ok') {
            expect(useLocalSession.getState().session?.churchId).toBe('north');
            expect(useActiveCalendarStore.getState().calendarId).toBe('north-calendar');
        }
    } finally {
        unsubscribe();
        calendarUnsubscribe();
        await unmount();
        client.clear();
        useLocalSession.setState({ session: before });
        useActiveCalendarStore.getState().reset();
        jest.restoreAllMocks();
    }
});
