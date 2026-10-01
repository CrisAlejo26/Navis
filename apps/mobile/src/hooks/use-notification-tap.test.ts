import { isolationSuite } from '@/data/test-support/church-isolation-suite';
import { ISOLATION_OWNER } from '@/data/test-support/seed-two-churches';
import { getDb } from '@/data/db';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement, type ReactNode } from 'react';
import { router, useSegments } from 'expo-router';
import { useLocalSession } from '@/stores/local-session';
import { useChurchTransition } from '@/stores/church-transition';
import { useNotificationTap } from './use-notification-tap';
const mockLast = jest.fn();
const mockClear = jest.fn();
type Response = { notification: { request: { content: { data?: unknown } } } };
const mockListen = jest.fn<{ remove: () => void }, [(response: Response) => void]>();
const mockRemove = jest.fn();
jest.mock('expo-router', () => ({
    router: {
        canDismiss: jest.fn(() => true),
        dismissAll: jest.fn(),
        replace: jest.fn(),
        push: jest.fn(),
    },
    useRootNavigationState: () => ({ key: 'root' }),
    useSegments: jest.fn(() => ['(tabs)']),
}));
jest.mock('@/lib/notifications/module', () => ({
    loadNotifications: () =>
        Promise.resolve({
            addNotificationResponseReceivedListener: mockListen,
            getLastNotificationResponse: mockLast,
            clearLastNotificationResponse: mockClear,
        }),
}));
jest.mock('@/lib/notifications/sync', () => ({ syncNotifications: () => Promise.resolve() }));
jest.mock('@/lib/church-changed-notice', () => ({ showChurchChanged: jest.fn() }));
const suite = isolationSuite();

// A5: usa el cambio real y SQLite; la apertura espera a terminar y montar las pestañas.
it.each(['live', 'cold'] as const)(
    'abre el aviso de otra iglesia (%s) después de cambiar',
    async (mode) => {
        const { north, south } = suite.churches();
        await (
            await getDb()
        ).runAsync(
            "INSERT INTO local_user (id, name, email, password_hash, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 't')",
            ISOLATION_OWNER,
            'Ana',
            'ana@navis.test',
            'hash',
            't',
        );
        const before = useLocalSession.getState();
        useLocalSession.setState({
            session: { userId: ISOLATION_OWNER, churchId: north.churchId },
            hydrated: true,
        });
        const response = {
            notification: {
                request: {
                    content: {
                        data: {
                            type: 'note-reminder',
                            churchId: south.churchId,
                            noteId: south.noteId,
                            believerId: south.believerId,
                        },
                    },
                },
            },
        };
        mockListen.mockReturnValue({ remove: mockRemove });
        mockLast.mockReturnValue(mode === 'cold' ? response : null);
        jest.clearAllMocks();
        jest.mocked(useSegments).mockReturnValue(['(tabs)']);
        const trace: string[] = [];
        jest.mocked(router.replace).mockImplementation(() => {
            trace.push('replace');
            jest.mocked(useSegments).mockReturnValue(['believers']);
        });
        jest.mocked(router.push).mockImplementation(() => {
            expect(useChurchTransition.getState().changing).toBe(false);
            expect(useLocalSession.getState().session?.churchId).toBe(south.churchId);
            trace.push('push');
        });
        const client = new QueryClient({
            defaultOptions: { queries: { gcTime: Infinity }, mutations: { gcTime: Infinity } },
        });
        const wrapper = ({ children }: { children: ReactNode }) =>
            createElement(QueryClientProvider, { client }, children);
        const { rerender, unmount } = await renderHook(useNotificationTap, { wrapper });
        try {
            await waitFor(() => expect(mockListen).toHaveBeenCalled());
            if (mode === 'live')
                await act(() => {
                    const listener = mockListen.mock.calls[0]?.[0] as (
                        value: typeof response,
                    ) => void;
                    listener(response);
                });
            await waitFor(() => expect(router.replace).toHaveBeenCalled());
            expect(router.push).not.toHaveBeenCalled();
            jest.mocked(useSegments).mockReturnValue(['(tabs)']);
            await rerender({});
            await waitFor(() =>
                expect(router.push).toHaveBeenCalledWith({
                    pathname: '/believers/notes/[id]',
                    params: { id: south.noteId },
                }),
            );
            expect(trace).toEqual(['replace', 'push']);
            if (mode === 'cold') expect(mockClear).toHaveBeenCalledTimes(1);
            expect(
                await (
                    await getDb()
                ).getFirstAsync(
                    'SELECT active_church_id FROM local_user WHERE id = ?',
                    ISOLATION_OWNER,
                ),
            ).toEqual({ active_church_id: south.churchId });
        } finally {
            await unmount();
            client.clear();
            useLocalSession.setState({ session: before.session, hydrated: before.hydrated });
        }
        expect(mockRemove).toHaveBeenCalled();
    },
);
