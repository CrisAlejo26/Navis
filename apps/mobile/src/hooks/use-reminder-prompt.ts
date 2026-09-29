import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Linking } from 'react-native';

import { notificationsSupported } from '@/lib/notifications/module';
import { getPermissionStatus, requestPermission } from '@/lib/notifications/permission';
import { syncNotifications } from '@/lib/notifications/sync';
import { useNotificationSettings } from '@/stores/notification-settings';

/**
 * Lo que hay que hacer justo después de guardar una nota **con recordatorio**:
 * es el momento en que la persona entiende para qué quiere el permiso, así que
 * aquí —y no al abrir la app— sale el diálogo del sistema. Concedido, se
 * programa el aviso; denegado, se dice cómo arreglarlo en vez de callar.
 */
export function useAfterReminderSaved(): () => Promise<void> {
    const { t } = useTranslation();

    return useCallback(async () => {
        const settings = useNotificationSettings.getState();
        if (!notificationsSupported() || !settings.enabled || !settings.noteReminders) return;

        let status = await getPermissionStatus();
        if (status === 'undetermined') status = await requestPermission();

        if (status === 'granted') {
            await syncNotifications();
            return;
        }
        Alert.alert(t('notifications.denied.title'), t('notifications.denied.body'), [
            { text: t('common.cancel'), style: 'cancel' },
            {
                text: t('notifications.denied.openSettings'),
                onPress: () => void Linking.openSettings(),
            },
        ]);
    }, [t]);
}
