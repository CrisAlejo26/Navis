import { loadNotifications } from '@/lib/notifications/module';
import { noticeDataSchema } from '@/lib/notifications/routes';
import {
    NOTICE_KEY_PREFIX,
    type NotificationScheduler,
    type PlannedNotice,
    type ScheduledNotice,
} from '@/lib/notifications/types';

/**
 * El adaptador real. Usa el **identificador** del sistema como clave del
 * aviso: programar otra vez con el mismo identificador lo sustituye, y la
 * fuente de verdad de «qué está programado» es el propio sistema, no una
 * tabla nuestra que se pueda desincronizar. La fecha viaja también en el
 * `data` porque es lo más fiable de releer en las dos plataformas.
 */
export async function createExpoScheduler(): Promise<NotificationScheduler | null> {
    const Notifications = await loadNotifications();
    if (!Notifications) return null;

    return {
        async list(): Promise<ScheduledNotice[]> {
            const requests = await Notifications.getAllScheduledNotificationsAsync();
            return requests
                .filter((request) => request.identifier.startsWith(NOTICE_KEY_PREFIX))
                .map((request) => {
                    const fireAt: unknown = request.content.data?.fireAt;
                    const parsed = noticeDataSchema.safeParse(request.content.data);
                    return {
                        data: parsed.success ? parsed.data : null,
                        key: request.identifier,
                        fireAt: typeof fireAt === 'number' ? fireAt : null,
                        title: request.content.title ?? '',
                        body: request.content.body ?? '',
                    };
                });
        },
        async schedule(notice: PlannedNotice): Promise<void> {
            await Notifications.scheduleNotificationAsync({
                identifier: notice.key,
                content: {
                    title: notice.title,
                    body: notice.body,
                    sound: true,
                    data: { ...notice.data, fireAt: notice.fireAt.getTime() },
                },
                trigger: {
                    type: Notifications.SchedulableTriggerInputTypes.DATE,
                    date: notice.fireAt,
                    channelId: notice.channelId,
                },
            });
        },
        async cancel(key: string): Promise<void> {
            await Notifications.cancelScheduledNotificationAsync(key);
        },
    };
}
