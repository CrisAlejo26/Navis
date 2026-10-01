import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';
import { ChurchList } from './church-list';
import { useMyChurches } from '@/hooks/use-my-churches';
import { useSwitchChurch } from '@/hooks/use-switch-church';
import { useLocalSession } from '@/stores/local-session';

jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));
jest.mock('@/hooks/use-my-churches');
jest.mock('@/hooks/use-switch-church');
const churches = ['north', 'south'].map((id) => ({
    id,
    name: id === 'north' ? 'Norte' : 'Sur',
    city: 'Madrid',
    slug: id,
    country: 'ES',
    timezone: 'UTC',
    ownerId: 'owner',
}));
const change = jest.fn();
beforeEach(() => {
    useLocalSession.getState().setSession({ userId: 'owner', churchId: 'north' });
    jest.mocked(useMyChurches).mockReturnValue({
        data: churches,
        isPending: false,
        isError: false,
    } as ReturnType<typeof useMyChurches>);
    jest.mocked(useSwitchChurch).mockReturnValue({
        switchChurch: change,
        isPending: false,
        error: null,
    });
    change.mockResolvedValue(churches[1]);
});
afterEach(() => {
    useLocalSession.getState().clear();
    jest.clearAllMocks();
});
// La activa se anuncia por selección y la acción Añadir sigue presente con una sola iglesia.
it('marca la activa, cambia por el hook y permite añadir fuera de auth', async () => {
    const close = jest.fn();
    await render(<ChurchList onClose={close} />);
    expect(screen.getByRole('button', { name: 'Norte' }).props.accessibilityState).toMatchObject({
        selected: true,
    });
    await fireEvent.press(screen.getByRole('button', { name: 'Sur' }));
    await waitFor(() => expect(change).toHaveBeenCalledWith('south'));
    expect(close).toHaveBeenCalled();
    await fireEvent.press(screen.getByRole('button', { name: 'Añadir iglesia' }));
    expect(router.push).toHaveBeenCalledWith('/church/new');
});
it('muestra el fallo sin cerrar ni alterar la activa', async () => {
    change.mockRejectedValue(new Error('not-found'));
    const close = jest.fn();
    await render(<ChurchList onClose={close} />);
    await fireEvent.press(screen.getByRole('button', { name: 'Sur' }));
    await waitFor(() =>
        expect(screen.getByText('Algo ha ido mal. Inténtalo de nuevo.')).toBeTruthy(),
    );
    expect(close).not.toHaveBeenCalled();
    expect(useLocalSession.getState().session?.churchId).toBe('north');
});
it('una iglesia no oculta Añadir y elegir la activa solo cierra', async () => {
    jest.mocked(useMyChurches).mockReturnValue({
        data: [churches[0]],
        isPending: false,
        isError: false,
    } as ReturnType<typeof useMyChurches>);
    const close = jest.fn();
    await render(<ChurchList onClose={close} />);
    await act(async () => {
        await fireEvent.press(screen.getByRole('button', { name: 'Norte' }));
    });
    expect(change).not.toHaveBeenCalled();
    expect(close).toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Añadir iglesia' })).toBeTruthy();
});
