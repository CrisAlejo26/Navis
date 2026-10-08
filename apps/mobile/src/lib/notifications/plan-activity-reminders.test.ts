import type { PendingActivityReminder } from '@/data/repos/activity-reminders-repo';
import { hrefForNotice, noticeDataSchema } from '@/lib/notifications/routes';
import {
    activityReminderKey,
    planActivityReminders,
    type ActivityReminderKey,
} from './plan-activity-reminders';

const t = (key: ActivityReminderKey) =>
    key === 'notifications.taskReminder.body' ? 'Tarea para ahora' : 'Hora del hábito';
const NOW = new Date('2026-10-08T10:00:00Z');

function reminder(overrides: Partial<PendingActivityReminder>): PendingActivityReminder {
    return {
        kind: 'task',
        id: 'tarea-1',
        churchId: 'iglesia-a',
        churchName: 'Iglesia A',
        title: 'Preparar el sermón',
        description: 'Leer Efesios 2',
        remindAt: '2026-10-09T17:30:00.000Z',
        ...overrides,
    };
}

describe('planActivityReminders: del recordatorio de una tarea o un hábito al aviso', () => {
    it('usa el título de la actividad y su descripción como cuerpo', () => {
        const [notice] = planActivityReminders([reminder({})], t, NOW, 50);
        expect(notice).toMatchObject({
            key: activityReminderKey('task', 'tarea-1'),
            title: 'Preparar el sermón',
            body: 'Leer Efesios 2',
            data: {
                type: 'activity-reminder',
                churchId: 'iglesia-a',
                kind: 'task',
                activityId: 'tarea-1',
            },
        });
        expect(notice?.fireAt.toISOString()).toBe('2026-10-09T17:30:00.000Z');
    });

    it('sin descripción, el cuerpo dice si es una tarea o un hábito', () => {
        const planned = planActivityReminders(
            [
                reminder({ description: '  ' }),
                reminder({ kind: 'habit', id: 'h-1', description: null }),
            ],
            t,
            NOW,
            50,
        );
        expect(planned.map((notice) => notice.body)).toEqual([
            'Tarea para ahora',
            'Hora del hábito',
        ]);
    });

    it('la clave distingue tarea y hábito con el mismo id', () => {
        const planned = planActivityReminders(
            [reminder({ id: 'x' }), reminder({ kind: 'habit', id: 'x' })],
            t,
            NOW,
            50,
        );
        expect(new Set(planned.map((notice) => notice.key)).size).toBe(2);
    });

    it('nombra la iglesia en el título cuando hay varias', () => {
        const [notice] = planActivityReminders([reminder({})], t, NOW, 50, true);
        expect(notice?.title).toBe('Preparar el sermón — Iglesia A');
    });

    it('no programa lo que ya pasó ni una fecha ilegible', () => {
        const planned = planActivityReminders(
            [
                reminder({ id: 'pasado', remindAt: '2026-10-08T09:00:00.000Z' }),
                reminder({ id: 'roto', remindAt: 'mañana' }),
            ],
            t,
            NOW,
            50,
        );
        expect(planned).toEqual([]);
    });

    it('deja solo las más próximas, en orden, cuando pasan del tope', () => {
        const many = ['12', '10', '11', '13'].map((day) =>
            reminder({ id: `t-${day}`, remindAt: `2026-10-${day}T08:00:00.000Z` }),
        );
        const planned = planActivityReminders(many, t, NOW, 2);
        expect(planned.map((notice) => notice.key)).toEqual([
            activityReminderKey('task', 't-10'),
            activityReminderKey('task', 't-11'),
        ]);
    });
});

describe('aviso de actividad: validación y destino', () => {
    it('lleva al detalle de la tarea o del hábito', () => {
        expect(
            hrefForNotice({
                type: 'activity-reminder',
                churchId: 'i',
                kind: 'habit',
                activityId: 'h-1',
            }),
        ).toEqual({ pathname: '/tasks/detail', params: { kind: 'habit', id: 'h-1' } });
    });

    it('rechaza un tipo de actividad desconocido o datos incompletos', () => {
        const base = { type: 'activity-reminder', churchId: 'i', activityId: 'a' };
        expect(noticeDataSchema.safeParse({ ...base, kind: 'nota' }).success).toBe(false);
        expect(hrefForNotice({ ...base })).toBeNull();
        expect(hrefForNotice({ type: 'activity-reminder', kind: 'task' })).toBeNull();
    });
});
