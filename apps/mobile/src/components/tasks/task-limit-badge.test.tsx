import { render, screen } from '@testing-library/react-native';
import { addDays, todayIn, type TaskOccurrence } from '@navis/shared';
import { TaskLimitBadge } from './task-limit-badge';

const today = todayIn(Intl.DateTimeFormat().resolvedOptions().timeZone);
const base: TaskOccurrence = {
    taskId: '00000000-0000-4000-8000-000000000001',
    date: today,
    title: 'Preparar el sermón',
    description: null,
    time: null,
    priority: 'media',
    status: 'pendiente',
    completedAt: null,
    isRecurring: false,
    tags: [],
    reminder: null,
    createdAt: 'now',
};

describe('chip de límite de una tarea', () => {
    it('dice cuándo vence mientras hay tiempo', async () => {
        await render(<TaskLimitBadge item={{ ...base, dueDate: addDays(today, 3) }} />);
        expect(screen.getByText(/^Vence /)).toBeTruthy();
    });

    it('con el límite pasado dice «Vencida» con la palabra, no solo con el color', async () => {
        await render(<TaskLimitBadge item={{ ...base, dueDate: addDays(today, -2) }} />);
        expect(screen.getByText(/^Vencida · /)).toBeTruthy();
    });

    it('una tarea completada no se marca como vencida', async () => {
        await render(
            <TaskLimitBadge
                item={{ ...base, status: 'completada', dueDate: addDays(today, -2) }}
            />,
        );
        expect(screen.queryByText(/Vencida/)).toBeNull();
    });

    it('sin límite no pinta nada', async () => {
        await render(<TaskLimitBadge item={base} />);
        expect(screen.queryByText(/Vence|Vencida/)).toBeNull();
    });
});
