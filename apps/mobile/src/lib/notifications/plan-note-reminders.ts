import { believerName } from '@navis/shared';

import type { PendingNoteReminder } from '@/data/repos/note-reminders-repo';
import { NOTE_REMINDER_CHANNEL } from '@/lib/notifications/setup';
import { NOTICE_KEY_PREFIX, type PlannedNotice } from '@/lib/notifications/types';

/** Las claves de traducción que usa este proveedor: cerradas, sin construir al vuelo. */
export type NoteReminderKey =
    'notifications.noteReminder.title' | 'notifications.noteReminder.body';

export type NoteReminderTranslator = (key: NoteReminderKey, vars: { name: string }) => string;

export const noteReminderKey = (noteId: string): string =>
    `${NOTICE_KEY_PREFIX}note-reminder:${noteId}`;

/**
 * Del recordatorio de una nota al aviso del sistema. Pura: no toca base de
 * datos ni sistema, así que se prueba con datos en la mano.
 *
 * `remindAt` no lleva zona: `new Date('2026-09-20T19:30:00')` lo interpreta
 * como hora **local**, que es la que el usuario eligió. Los pasados no se
 * programan, y el sistema tiene tope de alarmas: solo las `limit` más próximas
 * (el resto entra en la siguiente sincronización).
 */
export function planNoteReminders(
    reminders: PendingNoteReminder[],
    t: NoteReminderTranslator,
    now: Date,
    limit: number,
): PlannedNotice[] {
    return reminders
        .map((reminder) => ({ reminder, fireAt: new Date(reminder.remindAt) }))
        .filter(({ fireAt }) => !Number.isNaN(fireAt.getTime()) && fireAt.getTime() > now.getTime())
        .sort((one, other) => one.fireAt.getTime() - other.fireAt.getTime())
        .slice(0, limit)
        .map(({ reminder, fireAt }) => {
            const name = believerName(reminder);
            const text = reminder.remindText?.trim();
            return {
                key: noteReminderKey(reminder.noteId),
                fireAt,
                title: t('notifications.noteReminder.title', { name }),
                body: text || t('notifications.noteReminder.body', { name }),
                channelId: NOTE_REMINDER_CHANNEL,
                data: {
                    type: 'note-reminder' as const,
                    believerId: reminder.believerId,
                    noteId: reminder.noteId,
                },
            };
        });
}
