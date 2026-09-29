import Constants, { ExecutionEnvironment } from 'expo-constants';
import type * as ExpoNotifications from 'expo-notifications';

type NotificationsModule = typeof ExpoNotifications;

/** Expo Go no puede con las notificaciones: en él la interfaz no las ofrece ni las pide. */
export function notificationsSupported(): boolean {
    return Constants.executionEnvironment !== ExecutionEnvironment.StoreClient;
}

/**
 * `expo-notifications` se carga aquí y no arriba del todo: en Expo Go no
 * funciona (desde el SDK 53) y solo importarlo ya ensucia la consola. Con
 * `null`, todo lo demás se queda quieto en vez de romper.
 */
export async function loadNotifications(): Promise<NotificationsModule | null> {
    if (!notificationsSupported()) return null;
    try {
        return await import('expo-notifications');
    } catch (error) {
        console.warn('No he podido cargar expo-notifications:', error);
        return null;
    }
}
