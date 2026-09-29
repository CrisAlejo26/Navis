import { loadNotifications } from '@/lib/notifications/module';
import { NOTE_REMINDER_CHANNEL } from '@/lib/notifications/setup';

/**
 * Un aviso que suena a los dos segundos: la forma de comprobar en el teléfono
 * que el permiso, el canal y el sonido funcionan. Sin el prefijo de Navis en
 * el identificador, así la sincronización no lo cancela por «sobrante».
 */
export async function sendTestNotification(text: {
    title: string;
    body: string;
}): Promise<boolean> {
    const Notifications = await loadNotifications();
    if (!Notifications) return false;
    try {
        await Notifications.scheduleNotificationAsync({
            content: { title: text.title, body: text.body, sound: true, data: { type: 'test' } },
            trigger: {
                type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
                seconds: 2,
                channelId: NOTE_REMINDER_CHANNEL,
            },
        });
        return true;
    } catch (error) {
        console.warn('No he podido enviar el aviso de prueba:', error);
        return false;
    }
}
