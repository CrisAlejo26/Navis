import { render, screen, fireEvent } from '@testing-library/react-native';
import { TaskCard } from './task-card';
import { ActivityStatePicker } from './activity-state-picker';
import type { TaskOccurrence, HabitOccurrence } from '@navis/shared';
const item: TaskOccurrence = {
    taskId: 'a',
    title: 'Preparar el sermón',
    description: 'Revisar las notas',
    date: '2026-10-05',
    time: '09:30',
    priority: 'alta',
    status: 'pendiente',
    completedAt: null,
    isRecurring: false,
    tags: [],
    reminder: null,
    createdAt: 'now',
};
describe('tarjetas de agenda', () => {
    it('muestra contexto y hora; swipe completa o solicita borrar', async () => {
        const toggle = jest.fn(),
            remove = jest.fn(),
            press = jest.fn();
        await render(<TaskCard item={item} onPress={press} onToggle={toggle} onDelete={remove} />);
        expect(screen.getByText('09:30')).toBeTruthy();
        expect(screen.getByText('Revisar las notas')).toBeTruthy();
        await fireEvent.press(screen.getByTestId('swipe-left'));
        await fireEvent.press(screen.getByTestId('swipe-right'));
        expect(toggle).toHaveBeenCalledTimes(1);
        expect(remove).toHaveBeenCalledTimes(1);
        await fireEvent.press(
            screen.getByRole('button', { name: 'Preparar el sermón, Pendiente' }),
        );
        expect(press).toHaveBeenCalled();
    });
    it('los hábitos ofrecen solo sus dos estados válidos', async () => {
        const habit: HabitOccurrence = {
            habitId: 'h',
            title: 'Lectura',
            description: null,
            goal: null,
            date: item.date,
            time: null,
            status: 'pendiente',
            completedAt: null,
            isRecurring: true,
            tags: [],
            reminder: null,
            createdAt: 'now',
        };
        await render(
            <ActivityStatePicker kind="habit" value={habit.status} onChange={jest.fn()} />,
        );
        expect(screen.queryByRole('button', { name: 'En progreso' })).toBeNull();
        expect(screen.getByRole('button', { name: 'Completada' })).toBeTruthy();
    });
});
