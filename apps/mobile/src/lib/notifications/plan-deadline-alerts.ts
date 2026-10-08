import { taskDeadlineAlarm } from '@navis/shared';
import type { PendingTaskDeadline } from '@/data/repos/task-deadlines-repo';
import { NOTE_REMINDER_CHANNEL } from '@/lib/notifications/setup';
import { NOTICE_KEY_PREFIX, type PlannedNotice } from '@/lib/notifications/types';

export type DeadlineAlertKey =
    'notifications.deadlineAlert.title' | 'notifications.deadlineAlert.body';
export type DeadlineAlertTranslator = (key: DeadlineAlertKey, vars: { title: string }) => string;

export const deadlineAlertKey = (id: string): string =>
    `${NOTICE_KEY_PREFIX}deadline-alert:task:${id}`;

/**
 * La alarma del tiempo máximo en curso (Fase 7a). Pura, como los demás
 * planificadores. Al tocarla abre el detalle de la tarea, igual que su
 * recordatorio: el destino es el mismo `activity-reminder`, no un tipo nuevo.
 */
export function planDeadlineAlerts(
    tasks: PendingTaskDeadline[],
    t: DeadlineAlertTranslator,
    now: Date,
    limit: number,
    showChurchName = false,
): PlannedNotice[] {
    return tasks
        .flatMap((task) => {
            const fireAt = taskDeadlineAlarm(
                { status: 'en_progreso', inProgressDeadline: task.inProgressDeadline },
                now,
            );
            return fireAt ? [{ task, fireAt }] : [];
        })
        .sort((one, other) => one.fireAt.getTime() - other.fireAt.getTime())
        .slice(0, limit)
        .map(({ task, fireAt }) => {
            const title = showChurchName ? `${task.title} — ${task.churchName}` : task.title;
            return {
                key: deadlineAlertKey(task.id),
                fireAt,
                title: t('notifications.deadlineAlert.title', { title }),
                body: t('notifications.deadlineAlert.body', { title }),
                channelId: NOTE_REMINDER_CHANNEL,
                data: {
                    type: 'activity-reminder' as const,
                    churchId: task.churchId,
                    kind: 'task' as const,
                    activityId: task.id,
                },
            };
        });
}
