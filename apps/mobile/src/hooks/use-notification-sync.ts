import { useEffect } from 'react';
import { AppState } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ensureChannels, installNotificationHandler } from '@/lib/notifications/setup';
import { syncNotifications } from '@/lib/notifications/sync';
import { useLocalSession } from '@/stores/local-session';
import { useNotificationSettings } from '@/stores/notification-settings';

/**
 * Mantiene los avisos al día desde la raíz de la app: al arrancar, al cambiar
 * de sesión, de idioma (el texto de un aviso se congela al programarlo) o de
 * ajustes, y al volver a primer plano (por si el permiso cambió fuera). Al
 * guardar una nota lo sincroniza el propio guardado.
 */
export function useNotificationSync(): void {
    const { t, i18n } = useTranslation();
    const userId = useLocalSession((state) => state.session?.userId);
    const churchId = useLocalSession((state) => state.session?.churchId);
    const enabled = useNotificationSettings((state) => state.enabled);
    const noteReminders = useNotificationSettings((state) => state.noteReminders);
    const taskReminders = useNotificationSettings((state) => state.taskReminders);
    const language = i18n.language;

    useEffect(() => {
        void installNotificationHandler();
    }, []);

    useEffect(() => {
        void ensureChannels({
            name: t('notifications.channel.name'),
            description: t('notifications.channel.description'),
        }).then(() => syncNotifications());
    }, [t, language, userId, churchId, enabled, noteReminders, taskReminders]);

    useEffect(() => {
        const subscription = AppState.addEventListener('change', (state) => {
            if (state === 'active') void syncNotifications();
        });
        return () => subscription.remove();
    }, []);
}
