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
    it('lleva el límite de una tarea que no se repite y lo quita en una serie', () => {
        const single: Task = {
            ...task,
            isRecurring: false,
            repeatFreq: null,
            status: 'pendiente',
            dueDate: '2026-10-09',
            inProgressDeadline: '2026-10-05T16:00:00.000Z',
        };
        const draft = activityDraft('task', single.date, 'UTC', single);
        expect(draft).toMatchObject({
            limitEnabled: true,
            dueDate: '2026-10-09',
            deadlineEnabled: true,
            deadlineDate: '2026-10-05',
            deadlineTime: '16:00',
        });
        expect(draftInput(draft, 'UTC', single).input).toMatchObject({
            dueDate: '2026-10-09',
            inProgressDeadline: '2026-10-05T16:00:00.000Z',
        });
        const asSeries = draftInput({ ...draft, repeatFreq: 'diaria' }, 'UTC', single);
        expect(asSeries.input).toMatchObject({ dueDate: null, inProgressDeadline: null });
    });
    it('apagar los interruptores quita el límite', () => {
        const single: Task = {
            ...task,
            isRecurring: false,
            repeatFreq: null,
            dueDate: '2026-10-09',
        };
        const draft = activityDraft('task', single.date, 'UTC', single);
        const result = draftInput({ ...draft, limitEnabled: false, deadlineEnabled: false }, 'UTC');
        expect(result.input).toMatchObject({ dueDate: null, inProgressDeadline: null });
    });
    it('lleva el flujo de la tarea y lo quita si se elige «sin flujo»', () => {
        const single: Task = {
            ...task,
            isRecurring: false,
            repeatFreq: null,
            workflow: {
                id: '00000000-0000-4000-8000-000000000009',
                name: 'Visitas',
                accent: 'primary',
            },
        };
        const draft = activityDraft('task', single.date, 'UTC', single);
        expect(draft.workflowId).toBe('00000000-0000-4000-8000-000000000009');
        expect(draftInput(draft, 'UTC', single).input).toMatchObject({
            workflowId: '00000000-0000-4000-8000-000000000009',
        });
        expect(draftInput({ ...draft, workflowId: '' }, 'UTC', single).input).toMatchObject({
            workflowId: null,
        });
    });
});
