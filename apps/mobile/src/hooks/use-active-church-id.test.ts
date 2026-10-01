import { act, renderHook, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';
import { useActiveChurchId } from './use-active-church-id';
import { useLocalSession } from '@/stores/local-session';
import { useChurchTransition } from '@/stores/church-transition';

jest.mock('expo-router', () => ({ router: { replace: jest.fn() } }));
// Una consulta sin contexto se deshabilita y lleva al alta, nunca a una lista vacía.
it('redirige solo tras hidratar y bloquea durante el cambio', async () => {
    const before = useLocalSession.getState();
    useLocalSession.setState({ hydrated: false, session: null });
    const { result, unmount } = await renderHook(useActiveChurchId);
    try {
        expect(result.current).toBeNull();
        expect(router.replace).not.toHaveBeenCalled();
        await act(() => useLocalSession.setState({ hydrated: true }));
        await waitFor(() => expect(router.replace).toHaveBeenCalledWith('/(auth)/welcome'));
        await act(() => useLocalSession.getState().setSession({ userId: 'owner', churchId: null }));
        expect(router.replace).toHaveBeenLastCalledWith('/(auth)/church-setup');
        await act(() =>
            useLocalSession.getState().setSession({ userId: 'owner', churchId: 'north' }),
        );
        expect(result.current).toBe('north');
        jest.mocked(router.replace).mockClear();
        await act(() => useChurchTransition.setState({ changing: true }));
        expect(result.current).toBeNull();
        expect(router.replace).not.toHaveBeenCalled();
        await act(() => useChurchTransition.setState({ changing: false }));
        expect(result.current).toBe('north');
    } finally {
        await unmount();
        useLocalSession.setState(before);
        useChurchTransition.setState({ changing: false });
    }
});
