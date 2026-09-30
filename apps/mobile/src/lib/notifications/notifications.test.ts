import type { PendingNoteReminder } from '@/data/repos/note-reminders-repo';
import { hrefForNotice } from '@/lib/notifications/routes';
import { resolvePermission } from '@/lib/notifications/permission';
import { planNoteReminders, noteReminderKey } from '@/lib/notifications/plan-note-reminders';
import { reconcile } from '@/lib/notifications/reconcile';
import type {
    NotificationScheduler,
    PlannedNotice,
    ScheduledNotice,
} from '@/lib/notifications/types';

/** Un sistema de avisos en memoria: lo que el móvil real hace con `expo-notifications`. */
function memoryScheduler(initial: ScheduledNotice[] = []) {
    const scheduled = new Map(initial.map((notice) => [notice.key, notice]));
    const calls = { schedule: [] as string[], cancel: [] as string[] };
    const scheduler: NotificationScheduler = {
        list: () => Promise.resolve([...scheduled.values()]),
        schedule: (notice) => {
            calls.schedule.push(notice.key);
            scheduled.set(notice.key, {
                key: notice.key,
                fireAt: notice.fireAt.getTime(),
                title: notice.title,
                body: notice.body,
            });
            return Promise.resolve();
        },
        cancel: (key) => {
            calls.cancel.push(key);
            scheduled.delete(key);
            return Promise.resolve();
        },
    };
    return { scheduler, scheduled, calls };
}

const t = (key: string, vars: { name: string }) =>
    key === 'notifications.noteReminder.title'
        ? `Recordatorio: ${vars.name}`
        : `Nota de ${vars.name}`;

const NOW = new Date('2026-09-29T10:00:00');

function reminder(overrides: Partial<PendingNoteReminder>): PendingNoteReminder {
    return {
        noteId: 'nota-1',
        believerId: 'hermano-1',
        firstName: 'Marta',
        lastName: 'Ruiz',
        remindAt: '2026-09-30T19:30:00',
        remindText: 'Preguntarle por su madre',
        ...overrides,
    };
}

describe('planNoteReminders: del recordatorio de una nota al aviso', () => {
    it('usa el texto del recordatorio de cuerpo y el hermano en el título', () => {
        const [notice] = planNoteReminders([reminder({})], t, NOW, 50);

        expect(notice).toMatchObject({
            key: noteReminderKey('nota-1'),
            title: 'Recordatorio: Marta Ruiz',
            body: 'Preguntarle por su madre',
            data: { type: 'note-reminder', believerId: 'hermano-1', noteId: 'nota-1' },
        });
        // La hora es la local que se eligió, no una convertida por zona.
        expect(notice?.fireAt.getHours()).toBe(19);
        expect(notice?.fireAt.getMinutes()).toBe(30);
    });

    it('sin texto, el cuerpo dice de qué hermano es la nota', () => {
        const [notice] = planNoteReminders([reminder({ remindText: '  ' })], t, NOW, 50);
        expect(notice?.body).toBe('Nota de Marta Ruiz');
    });

    it('no programa lo que ya pasó ni una fecha ilegible', () => {
        const planned = planNoteReminders(
            [
                reminder({ noteId: 'pasado', remindAt: '2026-09-29T09:00:00' }),
                reminder({ noteId: 'roto', remindAt: 'mañana' }),
            ],
            t,
            NOW,
            50,
        );
        expect(planned).toEqual([]);
    });

    it('deja solo las más próximas cuando pasan del tope del sistema', () => {
        const many = ['01', '02', '03', '04'].map((day) =>
            reminder({ noteId: `nota-${day}`, remindAt: `2026-10-${day}T08:00:00` }),
        );
        const planned = planNoteReminders(many.reverse(), t, NOW, 2);
        expect(planned.map((notice) => notice.key)).toEqual([
            noteReminderKey('nota-01'),
            noteReminderKey('nota-02'),
        ]);
    });
});

describe('reconcile: deja el sistema como dice el plan', () => {
    const plan = (over: Partial<PlannedNotice> = {}): PlannedNotice => ({
        key: noteReminderKey('nota-1'),
        fireAt: new Date('2026-09-30T19:30:00'),
        title: 'Recordatorio: Marta',
        body: 'Llamarla',
        channelId: 'canal',
        data: { type: 'note-reminder', believerId: 'h', noteId: 'nota-1' },
        ...over,
    });

    it('programa lo que falta', async () => {
        const { scheduler, calls } = memoryScheduler();
        await reconcile(scheduler, [plan()]);
        expect(calls.schedule).toEqual([noteReminderKey('nota-1')]);
    });

    it('no vuelve a programar lo que ya está igual', async () => {
        const { scheduler, calls } = memoryScheduler();
        await reconcile(scheduler, [plan()]);
        await reconcile(scheduler, [plan()]);
        expect(calls.schedule).toHaveLength(1);
    });

    it('reprograma cuando cambia la hora o el texto (un recordatorio movido)', async () => {
        const { scheduler, calls, scheduled } = memoryScheduler();
        await reconcile(scheduler, [plan()]);
        await reconcile(scheduler, [plan({ fireAt: new Date('2026-10-02T08:00:00') })]);
        await reconcile(scheduler, [
            plan({ fireAt: new Date('2026-10-02T08:00:00'), body: 'Otro' }),
        ]);

        expect(calls.schedule).toHaveLength(3);
        expect(scheduled.get(noteReminderKey('nota-1'))?.body).toBe('Otro');
    });

    it('cancela el aviso de una nota cuyo recordatorio se quitó o se dio por hecho', async () => {
        const { scheduler, scheduled, calls } = memoryScheduler();
        await reconcile(scheduler, [plan()]);
        await reconcile(scheduler, []);

        expect(calls.cancel).toEqual([noteReminderKey('nota-1')]);
        expect(scheduled.size).toBe(0);
    });
});

describe('hrefForNotice: a dónde lleva un aviso al tocarlo', () => {
    // Regresión: llevaba directo al formulario de edición; ahora se llega a leer.
    it('el recordatorio de una nota lleva a la página de esa nota', () => {
        expect(
            hrefForNotice({ type: 'note-reminder', believerId: 'h-1', noteId: 'n-1', fireAt: 1 }),
        ).toEqual({ pathname: '/believers/notes/[id]', params: { id: 'n-1' } });
    });

    it('ignora lo que no es de Navis o viene incompleto', () => {
        expect(hrefForNotice(undefined)).toBeNull();
        expect(hrefForNotice({ type: 'test' })).toBeNull();
        expect(hrefForNotice({ type: 'note-reminder', believerId: 'h-1' })).toBeNull();
    });
});

describe('resolvePermission: los tres estados del permiso', () => {
    it('concedido, denegado y sin decidir', () => {
        expect(resolvePermission({ granted: true, canAskAgain: true, status: 'granted' })).toBe(
            'granted',
        );
        expect(resolvePermission({ granted: false, canAskAgain: false, status: 'denied' })).toBe(
            'denied',
        );
        expect(
            resolvePermission({ granted: false, canAskAgain: true, status: 'undetermined' }),
        ).toBe('undetermined');
    });

    // Regresión: Android informa «denied» de un permiso que aún no se ha pedido.
    it('un «denied» que todavía se puede preguntar es sin decidir', () => {
        expect(resolvePermission({ granted: false, canAskAgain: true, status: 'denied' })).toBe(
            'undetermined',
        );
    });

    it('si ya no se puede volver a preguntar, cuenta como denegado', () => {
        expect(
            resolvePermission({ granted: false, canAskAgain: false, status: 'undetermined' }),
        ).toBe('denied');
    });
});
