import type { PendingTaskDeadline } from '@/data/repos/task-deadlines-repo';
import {
    deadlineAlertKey,
    planDeadlineAlerts,
    type DeadlineAlertKey,
} from './plan-deadline-alerts';

const t = (key: DeadlineAlertKey, vars: { title: string }) =>
    key === 'notifications.deadlineAlert.title'
        ? `Se acabó: ${vars.title}`
        : `Sigue en curso: ${vars.title}`;
const NOW = new Date('2026-10-08T10:00:00Z');

function task(overrides: Partial<PendingTaskDeadline>): PendingTaskDeadline {
    return {
        id: 'tarea-1',
        churchId: 'iglesia-a',
        churchName: 'Iglesia A',
        title: 'Preparar el sermón',
        inProgressDeadline: '2026-10-08T12:00:00.000Z',
        ...overrides,
    };
}

describe('planDeadlineAlerts: la alarma del tiempo máximo en curso', () => {
    it('avisa a la hora del límite y abre el detalle de la tarea', () => {
        const [notice] = planDeadlineAlerts([task({})], t, NOW, 50);
        expect(notice).toMatchObject({
            key: deadlineAlertKey('tarea-1'),
            title: 'Se acabó: Preparar el sermón',
            body: 'Sigue en curso: Preparar el sermón',
            data: {
                type: 'activity-reminder',
                churchId: 'iglesia-a',
                kind: 'task',
                activityId: 'tarea-1',
            },
        });
        expect(notice?.fireAt.toISOString()).toBe('2026-10-08T12:00:00.000Z');
    });

    it('no avisa de un límite que ya pasó ni de uno ilegible', () => {
        expect(
            planDeadlineAlerts(
                [
                    task({ id: 'pasado', inProgressDeadline: '2026-10-08T09:00:00.000Z' }),
                    task({ id: 'roto', inProgressDeadline: 'luego' }),
                ],
                t,
                NOW,
                50,
            ),
        ).toEqual([]);
    });

    it('la clave no choca con la del recordatorio de la misma tarea', () => {
        expect(deadlineAlertKey('x')).not.toBe('navis:activity-reminder:task:x');
    });

    it('con varias iglesias nombra cuál es, y respeta el tope ordenando por hora', () => {
        const many = ['14', '13', '12'].map((hour) =>
            task({ id: `t-${hour}`, inProgressDeadline: `2026-10-08T${hour}:00:00.000Z` }),
        );
        const planned = planDeadlineAlerts(many, t, NOW, 2, true);
        expect(planned.map((notice) => notice.key)).toEqual([
            deadlineAlertKey('t-12'),
            deadlineAlertKey('t-13'),
        ]);
        expect(planned[0]?.title).toBe('Se acabó: Preparar el sermón — Iglesia A');
    });
});
