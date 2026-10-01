import { act, renderHook } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement, type ReactNode } from 'react';
import { router } from 'expo-router';
import { assertAccessible, setActiveChurch } from '@/data/repos/church-access';
import { useSwitchChurch } from './use-switch-church';
import { useLocalSession } from '@/stores/local-session';
import { useChurchTransition } from '@/stores/church-transition';

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

// No permite que dos selectores se pisen ni que una escritura reviva una sesión cerrada.
it('excluye cambios simultáneos y aborta si se cierra sesión durante la cancelación', async () => {
    const before = useLocalSession.getState().session;
    useLocalSession.getState().setSession({ userId: 'owner', churchId: 'north' });
    jest.mocked(assertAccessible).mockResolvedValue(church);
    const client = new QueryClient({ defaultOptions: { mutations: { gcTime: Infinity } } });
    let release: () => void = () => undefined;
    const pending = new Promise<void>((done) => {
        release = done;
    });
    const cancel = jest.spyOn(client, 'cancelQueries').mockReturnValue(pending);
    const wrapper = ({ children }: { children: ReactNode }) =>
        createElement(QueryClientProvider, { client }, children);
    const { result, unmount } = await renderHook(
        () => ({ first: useSwitchChurch(), second: useSwitchChurch() }),
        { wrapper },
    );
    try {
        await act(async () => {
            const first = result.current.first.switchChurch('south');
            const rejected = expect(first).rejects.toThrow('session-changed');
            await Promise.resolve();
            await expect(result.current.second.switchChurch('east')).rejects.toThrow(
                'church-switch-in-progress',
            );
            expect(cancel).toHaveBeenCalledTimes(1);
            useLocalSession.getState().clear();
            release();
            await rejected;
        });
        expect(setActiveChurch).not.toHaveBeenCalled();
        expect(router.replace).not.toHaveBeenCalled();
        expect(useLocalSession.getState().session).toBeNull();
        expect(useChurchTransition.getState().changing).toBe(false);
    } finally {
        release();
        await unmount();
        client.clear();
        useLocalSession.setState({ session: before });
        jest.restoreAllMocks();
    }
});
