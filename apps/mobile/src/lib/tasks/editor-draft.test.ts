import { activityDraft, draftInput } from './editor-draft';
import type { Task } from '@navis/shared';
const task: Task = {
    id: '00000000-0000-4000-8000-000000000001',
    title: 'Visita',
    description: null,
    date: '2026-10-05',
    time: null,
    priority: 'alta',
    isRecurring: true,
    repeatFreq: 'semanal',
    repeatInterval: 3,
    repeatEndType: 'cantidad',
    repeatEndDate: null,
    repeatEndCount: 8,
    status: null,
    completedAt: null,
    tags: [],
    reminder: { enabled: true, remindAt: '2026-10-05T07:30:00.000Z', tags: [] },
};
describe('borrador del editor', () => {
    it('preserva la regla de la serie y el momento del recordatorio al editar texto', () => {
        const draft = activityDraft('task', '2026-10-26', 'Europe/Madrid', task, 'completada');
        const result = draftInput({ ...draft, title: 'Visita confirmada' }, 'Europe/Madrid', task);
        expect(result.input).toMatchObject({
            title: 'Visita confirmada',
            repeatFreq: 'semanal',
            repeatInterval: 3,
            repeatEndType: 'cantidad',
            repeatEndCount: 8,
            reminderAt: task.reminder?.remindAt,
        });
        expect(draft.date).toBe(task.date);
        expect(draft.status).toBe('completada');
    });
    it('permite quitar la hora y apagar un recordatorio existente', () => {
        const result = draftInput(
            {
                ...activityDraft('task', task.date, 'UTC', task),
                reminderEnabled: false,
                allDay: true,
            },
            'UTC',
            task,
        );
        expect(result.input).toMatchObject({ time: null, reminderEnabled: false });
    });
});
