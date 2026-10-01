import { useRootNavigationState, useSegments } from 'expo-router';
import { useEffect, useRef } from 'react';

import { useNoticeNavigation } from './use-notice-navigation';
import { loadNotifications } from '@/lib/notifications/module';
import { useLocalSession } from '@/stores/local-session';

type Notifications = NonNullable<Awaited<ReturnType<typeof loadNotifications>>>;

/**
 * Lo que pasa al tocar un aviso: abrir la pantalla a la que lleva.
 *
 * Con la app abierta o en segundo plano llega por el listener. Con la app
 * **cerrada**, el toque es la respuesta «última» que guarda el sistema: se
 * lee una sola vez y solo cuando la navegación ya está montada y ha entrado
 * en las pestañas — antes, el `Redirect` de la portada pisaría la pantalla.
 */
export function useNotificationTap(): void {
    const open = useNoticeNavigation();
    const rootKey = useRootNavigationState()?.key;
    const inTabs = useSegments()[0] === '(tabs)';
    const signedIn = useLocalSession((state) => Boolean(state.session));
    const coldStartHandled = useRef(false);

    useEffect(() => {
        if (!rootKey || !signedIn) return;
        let subscription: { remove: () => void } | undefined;
        let cancelled = false;
        void loadNotifications().then((Notifications: Notifications | null) => {
            if (!Notifications || cancelled) return;
            subscription = Notifications.addNotificationResponseReceivedListener((response) =>
                open(response.notification.request.content.data),
            );
        });
        return () => {
            cancelled = true;
            subscription?.remove();
        };
    }, [rootKey, signedIn, open]);

    useEffect(() => {
        if (!rootKey || !signedIn || !inTabs || coldStartHandled.current) return;
        coldStartHandled.current = true;
        void loadNotifications().then((Notifications: Notifications | null) => {
            const last = Notifications?.getLastNotificationResponse();
            if (!Notifications || !last) return;
            Notifications.clearLastNotificationResponse();
            open(last.notification.request.content.data);
        });
    }, [rootKey, signedIn, inTabs, open]);
}
