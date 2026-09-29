import { brandColorHex } from '@navis/theme';

import { loadNotifications } from '@/lib/notifications/module';

/**
 * El id lleva versión: un canal de Android no se puede modificar una vez
 * creado (importancia, vibración…). Para cambiarlos se crea otro id.
 */
export const NOTE_REMINDER_CHANNEL = 'note-reminders-v1';

let handlerInstalled = false;

/** Con la app abierta, el aviso también se enseña (por defecto el sistema lo callaría). */
export async function installNotificationHandler(): Promise<void> {
    if (handlerInstalled) return;
    const Notifications = await loadNotifications();
    if (!Notifications) return;
    Notifications.setNotificationHandler({
        handleNotification: () =>
            Promise.resolve({
                shouldShowBanner: true,
                shouldShowList: true,
                shouldPlaySound: true,
                shouldSetBadge: false,
            }),
    });
    handlerInstalled = true;
}

/** Nombre y descripción se pueden actualizar: se rehace al cambiar de idioma. */
export async function ensureChannels(text: { name: string; description: string }): Promise<void> {
    const Notifications = await loadNotifications();
    if (!Notifications) return;
    try {
        await Notifications.setNotificationChannelAsync(NOTE_REMINDER_CHANNEL, {
            name: text.name,
            description: text.description,
            importance: Notifications.AndroidImportance.HIGH,
            vibrationPattern: [0, 250, 250, 250],
            // El azul de marca no cambia con el tema (Regla 3): sale del token.
            lightColor: brandColorHex,
            lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        });
    } catch (error) {
        console.warn('No he podido crear el canal de notificaciones:', error);
    }
}
