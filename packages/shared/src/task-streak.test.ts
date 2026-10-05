import { describe, expect, it } from 'vitest';
import { currentTaskStreak } from './task-streak';
import type { TaskOccurrence } from './schemas/tasks';

const item = (date: string, status: TaskOccurrence['status'] = 'completada'): TaskOccurrence => ({
    taskId: 'task',
    date,
    title: 'Visitar',
    description: null,
    time: null,
    priority: 'media',
    status,
    completedAt: null,
    isRecurring: false,
    tags: [],
    reminder: null,
    createdAt: '2026-10-01',
});
describe('racha compartida de El Faro', () => {
    it('salta días vacíos y cuenta hoy solo si todas las tareas están hechas', () => {
        const items = [item('2026-10-02'), item('2026-10-04'), item('2026-10-05', 'pendiente')];
        expect(currentTaskStreak(items, '2026-10-05')).toBe(2);
        expect(currentTaskStreak([...items.slice(0, 2), item('2026-10-05')], '2026-10-05')).toBe(3);
    });
    it('un día incompleto corta la racha, aunque hoy esté cumplido', () => {
        expect(
            currentTaskStreak(
                [item('2026-10-03'), item('2026-10-04', 'en_progreso'), item('2026-10-05')],
                '2026-10-05',
            ),
        ).toBe(1);
    });
    it('no cuenta un día parcialmente completado ni fechas fuera del tramo', () => {
        expect(
            currentTaskStreak(
                [item('2026-10-04'), item('2026-10-04', 'pendiente'), item('2026-10-06')],
                '2026-10-05',
            ),
        ).toBe(0);
        expect(currentTaskStreak([], '2026-10-05')).toBe(0);
    });
});
