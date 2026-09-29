import { useCallback, useEffect, useState } from 'react';
import { AppState, Linking } from 'react-native';

import {
    getPermissionStatus,
    requestPermission,
    type PermissionStatus,
} from '@/lib/notifications/permission';

/**
 * El permiso de avisos del sistema. Al volver a primer plano se **vuelve a
 * comprobar**: quien lo concede desde los ajustes del teléfono vuelve a la
 * app y el aviso de «denegado» tiene que desaparecer solo (si no, callejón
 * sin salida).
 */
export function useNotificationPermission() {
    const [status, setStatus] = useState<PermissionStatus>('undetermined');

    const refresh = useCallback(async (): Promise<PermissionStatus> => {
        const next = await getPermissionStatus();
        setStatus(next);
        return next;
    }, []);

    useEffect(() => {
        // `then` y no `await refresh()`: el estado se fija cuando llega la
        // respuesta del sistema, no de forma síncrona dentro del efecto.
        const load = () => void getPermissionStatus().then(setStatus);
        load();
        const subscription = AppState.addEventListener('change', (state) => {
            if (state === 'active') load();
        });
        return () => subscription.remove();
    }, []);

    const request = useCallback(async (): Promise<PermissionStatus> => {
        const next = await requestPermission();
        setStatus(next);
        return next;
    }, []);

    const openSystemSettings = useCallback(() => {
        Linking.openSettings().catch(() => undefined);
    }, []);

    return { status, request, refresh, openSystemSettings };
}
