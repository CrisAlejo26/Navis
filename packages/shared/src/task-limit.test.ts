import { describe, expect, it } from 'vitest';
import { isTaskOverdue, taskDeadlineAlarm } from './task-limit';

describe('isTaskOverdue', () => {
    it('vence cuando el límite es anterior a hoy y no está completada', () => {
        expect(isTaskOverdue({ dueDate: '2026-10-07', status: 'pendiente' }, '2026-10-08')).toBe(
            true,
        );
        expect(isTaskOverdue({ dueDate: '2026-10-07', status: 'en_progreso' }, '2026-10-08')).toBe(
            true,
        );
    });

    it('el mismo día del límite todavía no está vencida', () => {
        expect(isTaskOverdue({ dueDate: '2026-10-08', status: 'pendiente' }, '2026-10-08')).toBe(
            false,
        );
    });

    it('una tarea completada nunca está vencida, ni la que no tiene límite', () => {
        expect(isTaskOverdue({ dueDate: '2026-10-01', status: 'completada' }, '2026-10-08')).toBe(
            false,
        );
        expect(isTaskOverdue({ dueDate: null, status: 'pendiente' }, '2026-10-08')).toBe(false);
        expect(isTaskOverdue({ status: 'pendiente' }, '2026-10-08')).toBe(false);
    });
});

describe('taskDeadlineAlarm', () => {
    const now = new Date('2026-10-08T10:00:00.000Z');
    const deadline = '2026-10-08T12:00:00.000Z';

    it('solo existe mientras la tarea está en progreso', () => {
        expect(
            taskDeadlineAlarm({ status: 'en_progreso', inProgressDeadline: deadline }, now),
        ).toEqual(new Date(deadline));
        expect(
            taskDeadlineAlarm({ status: 'pendiente', inProgressDeadline: deadline }, now),
        ).toBeNull();
        expect(
            taskDeadlineAlarm({ status: 'completada', inProgressDeadline: deadline }, now),
        ).toBeNull();
        expect(taskDeadlineAlarm({ status: null, inProgressDeadline: deadline }, now)).toBeNull();
    });

    it('no programa una hora pasada, ausente o ilegible', () => {
        expect(
            taskDeadlineAlarm(
                { status: 'en_progreso', inProgressDeadline: '2026-10-08T09:00:00.000Z' },
                now,
            ),
        ).toBeNull();
        expect(
            taskDeadlineAlarm({ status: 'en_progreso', inProgressDeadline: null }, now),
        ).toBeNull();
        expect(
            taskDeadlineAlarm({ status: 'en_progreso', inProgressDeadline: 'luego' }, now),
        ).toBeNull();
    });
});
