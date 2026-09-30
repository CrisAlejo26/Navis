import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { SettingsRow } from '@/components/settings/settings-row';
import { useNotificationPermission } from '@/hooks/use-notification-permission';
import { notificationsSupported } from '@/lib/notifications/module';
import { useNotificationSettings } from '@/stores/notification-settings';

/**
 * La fila de avisos: dice en qué estado están («Activados», «Desactivados»,
 * «Sin permiso») y abre su pantalla. Sin permiso del sistema no cuenta como
 * activado aunque el interruptor esté encendido.
 */
export function NotificationsRow() {
    const { t } = useTranslation();
    const { status } = useNotificationPermission();
    const enabled = useNotificationSettings((state) => state.enabled);

    const state =
        status === 'denied'
            ? 'notifications.stateDenied'
            : enabled
              ? 'notifications.stateOn'
              : 'notifications.stateOff';

    return (
        <SettingsRow
            icon="notifications-outline"
            title={t('notifications.title')}
            value={notificationsSupported() ? t(state) : undefined}
            onPress={() => router.push('/settings/notifications')}
        />
    );
}
