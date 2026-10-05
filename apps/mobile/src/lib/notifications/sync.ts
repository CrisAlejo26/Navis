import { listPendingNoteReminders } from '@/data/repos/note-reminders-repo';
import { listMyChurches } from '@/data/repos/church-access';
import { i18n } from '@/lib/i18n';
import { createExpoScheduler } from '@/lib/notifications/expo-scheduler';
import { getPermissionStatus } from '@/lib/notifications/permission';
import { planNoteReminders } from '@/lib/notifications/plan-note-reminders';
import { planJournalReminders } from './plan-journal-reminders';
import { reconcile } from '@/lib/notifications/reconcile';
import type { PlannedNotice } from '@/lib/notifications/types';
import { useLocalSession } from '@/stores/local-session';
import { useNotificationSettings } from '@/stores/notification-settings';

/** Alarmas que se dejan pendientes a la vez: iOS corta en 64 y Android según el fabricante. */
const MAX_PENDING = 50;

async function planEverything(): Promise<PlannedNotice[]> {
    const settings = useNotificationSettings.getState();
    const session = useLocalSession.getState().session;
    if (!session || !settings.enabled) return [];
    if ((await getPermissionStatus()) !== 'granted') return [];

    const planned: PlannedNotice[] = [];
    if (settings.noteReminders) {
        planned.push(...(await planJournalReminders(session.userId)));
        const churches = await listMyChurches(session.userId);
        const reminders = await listPendingNoteReminders(session.userId);
        planned.push(
            ...planNoteReminders(
                reminders,
                (key, vars) => i18n.t(key, vars),
                new Date(),
                MAX_PENDING,
                churches.length > 1,
            ),
        );
    }
    return planned.sort((a, b) => a.fireAt.getTime() - b.fireAt.getTime()).slice(0, MAX_PENDING);
}

async function run(): Promise<void> {
    try {
        const scheduler = await createExpoScheduler();
        if (!scheduler) return;
        await reconcile(scheduler, await planEverything());
    } catch (error) {
        // Un fallo al programar no puede romper la pantalla que guardó la nota.
        console.warn('No he podido sincronizar los avisos:', error);
    }
}

// Las sincronizaciones van de una en una: dos a la vez leerían el mismo estado
// y programarían dos veces lo mismo.
let queue: Promise<void> = Promise.resolve();

/**
 * Pone los avisos del teléfono al día con lo que hay en la base: lo llaman el
 * arranque, los cambios de ajustes, de idioma y de sesión, y cada nota que se
 * guarda, edita o borra. Sin sesión, sin permiso o con el interruptor apagado,
 * el plan es vacío y se cancela todo lo nuestro.
 */
export function syncNotifications(): Promise<void> {
    queue = queue.then(run, run);
    return queue;
}
