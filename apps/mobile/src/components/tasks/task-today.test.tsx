import { fireEvent, render, screen } from '@testing-library/react-native';
import { HabitTodayCard } from './habit-today-card';
import { TaskTodayEmpty } from './task-today-empty';
import type { TaskTodayState } from './use-task-today';
import type { HabitOccurrence } from '@navis/shared';

jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));

const item: HabitOccurrence = {
    habitId: 'habit',
    date: '2026-10-05',
    title: 'Lectura diaria',
    goal: 'Un capítulo',
    description: null,
    time: '08:00',
    status: 'pendiente',
    completedAt: null,
    isRecurring: true,
    tags: [],
    reminder: null,
    createdAt: '2026-10-01T00:00:00Z',
};
describe('Hoy: cumplimiento y vacíos', () => {
    it('el anillo completa una ocurrencia y el título abre su detalle', async () => {
        const toggle = jest.fn(),
            open = jest.fn();
        await render(<HabitTodayCard item={item} busy={false} onToggle={toggle} onPress={open} />);
        expect(screen.getByText('Un capítulo')).toBeTruthy();
        expect(screen.getByText('0/1')).toBeTruthy();
        await fireEvent.press(screen.getByRole('button', { name: 'Completar: Lectura diaria' }));
        expect(toggle).toHaveBeenCalledTimes(1);
        expect(open).not.toHaveBeenCalled();
        await fireEvent.press(screen.getByRole('button', { name: 'Lectura diaria' }));
        expect(open).toHaveBeenCalledTimes(1);
    });
    it('una mutación en curso desactiva el anillo y una completada se puede reabrir', async () => {
        const toggle = jest.fn();
        await render(
            <HabitTodayCard
                item={{ ...item, status: 'completada' }}
                busy
                onToggle={toggle}
                onPress={jest.fn()}
            />,
        );
        await fireEvent.press(screen.getByRole('button', { name: 'Reabrir: Lectura diaria' }));
        expect(toggle).not.toHaveBeenCalled();
        expect(screen.getByText('1/1')).toBeTruthy();
    });
    it('el vacío filtrado permite restablecer y el error permite reintentar', async () => {
        const reset = jest.fn(),
            retry = jest.fn();
        const state = {
            kind: 'habit',
            filter: 'done',
            setFilter: reset,
            listing: { isPending: false, isError: false, refetch: retry },
        } as unknown as TaskTodayState;
        const view = await render(<TaskTodayEmpty state={state} />);
        await fireEvent.press(screen.getByRole('button', { name: 'Restablecer' }));
        expect(reset).toHaveBeenCalledWith('all');
        const failed = {
            ...state,
            listing: { ...state.listing, isError: true },
        } as unknown as TaskTodayState;
        await view.rerender(<TaskTodayEmpty state={failed} />);
        await fireEvent.press(screen.getByRole('button', { name: 'Reintentar' }));
        expect(retry).toHaveBeenCalledTimes(1);
    });
});
