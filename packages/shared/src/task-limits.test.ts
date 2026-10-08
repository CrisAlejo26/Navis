import { describe, expect, it } from 'vitest';
import { createTaskSchema, updateTaskSchema } from './schemas/tasks';

const base = { title: 'Preparar el sermón', date: '2026-10-05' };

describe('límite de una tarea', () => {
    it('acepta una fecha límite y un tiempo máximo en curso', () => {
        const parsed = createTaskSchema.parse({
            ...base,
            dueDate: '2026-10-09',
            inProgressDeadline: '2026-10-05T18:00:00.000Z',
        });
        expect(parsed).toMatchObject({ dueDate: '2026-10-09' });
    });

    it('el límite puede ser el mismo día, pero no anterior', () => {
        expect(createTaskSchema.safeParse({ ...base, dueDate: '2026-10-05' }).success).toBe(true);
        const result = createTaskSchema.safeParse({ ...base, dueDate: '2026-10-04' });
        expect(result.success).toBe(false);
    });

    it('una serie no tiene fecha límite ni tiempo máximo', () => {
        const serie = { ...base, isRecurring: true, repeatFreq: 'diaria' as const };
        expect(createTaskSchema.safeParse({ ...serie, dueDate: '2026-10-09' }).success).toBe(false);
        expect(
            createTaskSchema.safeParse({ ...serie, inProgressDeadline: '2026-10-05T18:00' })
                .success,
        ).toBe(false);
        expect(createTaskSchema.safeParse(serie).success).toBe(true);
    });

    it('el tiempo máximo exige día y hora, como el recordatorio', () => {
        expect(createTaskSchema.safeParse({ ...base, inProgressDeadline: 'mañana' }).success).toBe(
            false,
        );
    });

    it('al editar se puede quitar con null y llega solo lo que cambia', () => {
        expect(updateTaskSchema.parse({ dueDate: null, inProgressDeadline: null })).toEqual({
            dueDate: null,
            inProgressDeadline: null,
        });
    });
});
