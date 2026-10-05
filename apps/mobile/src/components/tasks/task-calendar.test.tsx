import { render, screen, fireEvent } from '@testing-library/react-native';
import { TaskCalendar } from './task-calendar';
import type { TaskOccurrence } from '@navis/shared';
const base: TaskOccurrence = {
    taskId: 'a',
    title: 'Lectura',
    description: null,
    date: '2026-10-05',
    time: null,
    priority: 'media',
    status: 'completada',
    completedAt: 'now',
    isRecurring: false,
    tags: [],
    reminder: null,
    createdAt: 'now',
};
it('anuncia progreso por día y permite navegar y seleccionar sin cambiar el mes por accidente', async () => {
    const select = jest.fn(),
        month = jest.fn();
    await render(
        <TaskCalendar
            month="2026-10-05"
            today="2026-10-05"
            selected="2026-10-05"
            items={[base, { ...base, taskId: 'b', status: 'pendiente' }]}
            onSelect={select}
            onMonth={month}
        />,
    );
    await fireEvent.press(screen.getByRole('button', { name: '2026-10-05: 1 de 2 completadas' }));
    expect(select).toHaveBeenCalledWith('2026-10-05');
    expect(month).not.toHaveBeenCalled();
    await fireEvent.press(screen.getByRole('button', { name: 'Mes siguiente' }));
    expect(month).toHaveBeenCalledWith('2026-11-01');
});
