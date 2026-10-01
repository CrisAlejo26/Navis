import { act, renderHook, waitFor } from '@testing-library/react-native';
import { createElement, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useChurchAccessGate } from './use-church-access-gate';
import { resolveActiveChurch } from '@/data/repos/church-access';
import { useChurchTransition } from '@/stores/church-transition';
import { useLocalSession } from '@/stores/local-session';

jest.mock('@/data/repos/church-access', () => ({ resolveActiveChurch: jest.fn() }));
const resolve = jest.mocked(resolveActiveChurch);
// I9: el contexto inválido nunca monta datos pastorales antes de resolver SQLite.
it.each(['sur', null])('reconcilia la sesión antes de abrir pestañas (%s)', async (churchId) => {
    const before = useLocalSession.getState();
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const wrapper = ({ children }: { children: ReactNode }) =>
        createElement(QueryClientProvider, { client }, children);
    let release: () => void = () => undefined;
    const pending = new Promise<void>((done) => {
        release = done;
    });
    resolve.mockImplementation(async () => {
        await pending;
        return churchId
            ? {
                  id: churchId,
                  name: 'Sur',
                  slug: 'sur',
                  city: null,
                  timezone: 'UTC',
                  country: 'ES',
                  ownerId: 'user',
              }
            : null;
    });
    useLocalSession.setState({ hydrated: true, session: { userId: 'user', churchId: 'borrada' } });
    const { result, unmount } = await renderHook(useChurchAccessGate, { wrapper });
    try {
        expect(result.current.ready).toBe(false);
        await act(() => release());
        await waitFor(() => expect(result.current.ready).toBe(true));
        expect(result.current.session?.churchId).toBe(churchId);
        await act(() => useChurchTransition.setState({ changing: true }));
        expect(result.current.ready).toBe(false);
        await act(() => useChurchTransition.setState({ changing: false }));
        await waitFor(() => expect(result.current.ready).toBe(true));
    } finally {
        await unmount();
        client.clear();
        useLocalSession.setState(before);
        useChurchTransition.setState({ changing: false });
    }
});
