import { Alert } from 'react-native';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';
import type { Task } from '@navis/shared';
import { TaskOrderScreen } from './task-order-screen';

const mockSave = jest.fn();
const base: Task = {
    id: '',
    title: '',
    description: null,
    date: '2026-10-05',
    time: null,
    priority: 'media',
    status: 'pendiente',
    completedAt: null,
    isRecurring: false,
    repeatFreq: null,
    repeatInterval: 1,
    repeatEndType: null,
    repeatEndDate: null,
    repeatEndCount: null,
    tags: [],
    reminder: null,
};
const mockTasks = ['Llamar a Andrés', 'Enviar resumen', 'Preparar sermón'].map((title, index) => ({
    ...base,
    id: `t-${index + 1}`,
    title,
}));
jest.mock('@/hooks/use-task-series', () => ({
    useTaskTemplates: () => ({
        data: { pages: [{ items: mockTasks }] },
        isPending: false,
        isError: false,
        isFetchingNextPage: false,
        hasNextPage: false,
    }),
    useTaskOrder: () => ({ mutateAsync: mockSave, isPending: false }),
}));
jest.mock('expo-router', () => ({
    router: { replace: jest.fn(), back: jest.fn(), push: jest.fn() },
    useRouter: () => ({ back: jest.fn() }),
}));

const order = () =>
    screen
        .getAllByRole('checkbox')
        .map((row) => String((row.props as Record<string, unknown>).accessibilityLabel));

describe('pantalla de ordenar tareas', () => {
    beforeEach(() => jest.clearAllMocks());

    it('enseña las tareas numeradas en su orden actual', async () => {
        await render(<TaskOrderScreen />);
        expect(order()).toEqual(['Llamar a Andrés', 'Enviar resumen', 'Preparar sermón']);
    });

    it('bajar una tarea la cambia de sitio y guardar envía el orden nuevo', async () => {
        mockSave.mockResolvedValue(undefined);
        await render(<TaskOrderScreen />);
        await fireEvent.press(screen.getByRole('button', { name: 'Bajar: Llamar a Andrés' }));
        expect(order()).toEqual(['Enviar resumen', 'Llamar a Andrés', 'Preparar sermón']);
        await fireEvent.press(screen.getByRole('button', { name: 'Guardar' }));
        await waitFor(() => expect(mockSave).toHaveBeenCalled());
        expect(mockSave).toHaveBeenCalledWith({ ids: ['t-2', 't-1', 't-3'] });
        expect(router.replace).toHaveBeenCalledWith({
            pathname: '/tasks/list',
            params: { sort: 'manual' },
        });
    });

    it('los extremos no se pueden mover hacia fuera', async () => {
        await render(<TaskOrderScreen />);
        const up = screen.getByRole('button', { name: 'Subir: Llamar a Andrés' });
        const down = screen.getByRole('button', { name: 'Bajar: Preparar sermón' });
        expect(up).toBeDisabled();
        expect(down).toBeDisabled();
    });

    it('varias seleccionadas se mueven juntas', async () => {
        await render(<TaskOrderScreen />);
        await fireEvent.press(screen.getByRole('checkbox', { name: 'Llamar a Andrés' }));
        await fireEvent.press(screen.getByRole('checkbox', { name: 'Enviar resumen' }));
        await fireEvent.press(screen.getByRole('button', { name: 'Bajar' }));
        expect(order()).toEqual(['Preparar sermón', 'Llamar a Andrés', 'Enviar resumen']);
    });

    it('si guardar falla avisa y no sale de la pantalla', async () => {
        mockSave.mockRejectedValue(new Error('boom'));
        const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
        await render(<TaskOrderScreen />);
        await fireEvent.press(screen.getByRole('button', { name: 'Guardar' }));
        await waitFor(() => expect(alert).toHaveBeenCalled());
        expect(router.replace).not.toHaveBeenCalled();
    });
});
