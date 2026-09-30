import { loadNotifications } from '@/lib/notifications/module';

export type PermissionStatus = 'granted' | 'denied' | 'undetermined';

interface PermissionResult {
    granted: boolean;
    canAskAgain: boolean;
    status: string;
}

/**
 * Los tres estados que le importan a la interfaz. Manda `canAskAgain`, no
 * `status`: en Android un permiso **nunca pedido** llega como
 * `status: 'denied'` con `canAskAgain: true`, y tratarlo como denegado
 * impedía que saliera el diálogo del sistema. Sin poder preguntar de nuevo
 * (dos «no» seguidos) el único camino son los ajustes del teléfono.
 */
export function resolvePermission(result: PermissionResult): PermissionStatus {
    if (result.granted || result.status === 'granted') return 'granted';
    if (!result.canAskAgain) return 'denied';
    return 'undetermined';
}

export async function getPermissionStatus(): Promise<PermissionStatus> {
    const Notifications = await loadNotifications();
    if (!Notifications) return 'undetermined';
    try {
        return resolvePermission(await Notifications.getPermissionsAsync());
    } catch {
        return 'undetermined';
    }
}

/** Abre el diálogo **del sistema**; solo aparece si aún se puede preguntar. */
export async function requestPermission(): Promise<PermissionStatus> {
    const Notifications = await loadNotifications();
    if (!Notifications) return 'denied';
    try {
        const current = resolvePermission(await Notifications.getPermissionsAsync());
        if (current !== 'undetermined') return current;
        return resolvePermission(
            await Notifications.requestPermissionsAsync({
                ios: { allowAlert: true, allowSound: true, allowBadge: false },
            }),
        );
    } catch {
        return 'denied';
    }
}
