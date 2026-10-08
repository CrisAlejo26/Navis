import type { PendingActivityReminder } from '@/data/repos/activity-reminders-repo';
import { NOTE_REMINDER_CHANNEL } from '@/lib/notifications/setup';
import { NOTICE_KEY_PREFIX, type PlannedNotice } from '@/lib/notifications/types';

/** Las claves de traducción de este proveedor: cerradas, sin construir al vuelo. */
export type ActivityReminderKey =
    'notifications.taskReminder.body' | 'notifications.habitReminder.body';

export type ActivityReminderTranslator = (key: ActivityReminderKey) => string;

export const activityReminderKey = (kind: string, id: string): string =>
    `${NOTICE_KEY_PREFIX}activity-reminder:${kind}:${id}`;

/**
 * Del recordatorio de una tarea o un hábito al aviso del sistema. Pura, como
 * `planNoteReminders`: el título del aviso es el de la actividad, y el cuerpo,
 * su descripción o, si no tiene, una frase que dice de qué se trata. Los
 * instantes pasados no se programan y solo entran las `limit` más próximas.
 */
export function planActivityReminders(
    reminders: PendingActivityReminder[],
    t: ActivityReminderTranslator,
    now: Date,
    limit: number,
    showChurchName = false,
): PlannedNotice[] {
    return reminders
        .map((reminder) => ({ reminder, fireAt: new Date(reminder.remindAt) }))
        .filter(({ fireAt }) => !Number.isNaN(fireAt.getTime()) && fireAt.getTime() > now.getTime())
        .sort((one, other) => one.fireAt.getTime() - other.fireAt.getTime())
        .slice(0, limit)
        .map(({ reminder, fireAt }) => {
            const text = reminder.description?.trim();
            const fallback = t(
                reminder.kind === 'task'
                    ? 'notifications.taskReminder.body'
                    : 'notifications.habitReminder.body',
            );
            return {
                key: activityReminderKey(reminder.kind, reminder.id),
                fireAt,
                title: showChurchName
                    ? `${reminder.title} — ${reminder.churchName}`
                    : reminder.title,
                body: text || fallback,
                channelId: NOTE_REMINDER_CHANNEL,
                data: {
                    type: 'activity-reminder' as const,
                    churchId: reminder.churchId,
                    kind: reminder.kind,
                    activityId: reminder.id,
                },
            };
        });
}
