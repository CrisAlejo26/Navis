import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { useNotificationPermission } from '@/hooks/use-notification-permission';
import { notificationsSupported } from '@/lib/notifications/module';
import { sendTestNotification } from '@/lib/notifications/send-test';
import { useNotificationSettings } from '@/stores/notification-settings';

/**
 * Los avisos de este teléfono. Activar el interruptor es el momento de pedir
 * el permiso del sistema: si no lo dan, no se enciende (mejor eso que un
 * interruptor encendido que nunca avisa) y se enseña cómo arreglarlo. El
 * botón de prueba es la forma de ver, sin esperar a una nota, que suena.
 */
export function NotificationsCard() {
    const { t } = useTranslation();
    const { status, request, openSystemSettings } = useNotificationPermission();
    const enabled = useNotificationSettings((state) => state.enabled);
    const noteReminders = useNotificationSettings((state) => state.noteReminders);
    const setEnabled = useNotificationSettings((state) => state.setEnabled);
    const setNoteReminders = useNotificationSettings((state) => state.setNoteReminders);
    const [feedback, setFeedback] = useState<string | null>(null);

    if (!notificationsSupported()) {
        return (
            <Card title={t('notifications.title')} description={t('notifications.unsupported')} />
        );
    }

    async function toggleMaster(next: boolean) {
        if (!next) {
            setEnabled(false);
            return;
        }
        if ((await request()) === 'granted') setEnabled(true);
    }

    async function sendTest() {
        setFeedback(null);
        const granted = status === 'granted' || (await request()) === 'granted';
        if (!granted) return;
        const sent = await sendTestNotification({
            title: t('notifications.testTitle'),
            body: t('notifications.testBody'),
        });
        setFeedback(t(sent ? 'notifications.testSent' : 'notifications.testFailed'));
    }

    return (
        <Card title={t('notifications.title')}>
            <View className="gap-1 pt-1">
                <Switch
                    label={t('notifications.master')}
                    description={t('notifications.masterHint')}
                    checked={enabled && status !== 'denied'}
                    onChange={(next) => void toggleMaster(next)}
                />
                <Switch
                    label={t('notifications.noteReminders')}
                    description={t('notifications.noteRemindersHint')}
                    checked={noteReminders}
                    onChange={setNoteReminders}
                    disabled={!enabled}
                />
            </View>

            {status === 'denied' ? (
                <View className="gap-2 mt-1">
                    <Text className="text-sm font-sans-semibold text-foreground">
                        {t('notifications.denied.title')}
                    </Text>
                    <Text className="text-sm font-sans text-muted-foreground">
                        {t('notifications.denied.body')}
                    </Text>
                    <Button
                        title={t('notifications.denied.openSettings')}
                        variant="secondary"
                        onPress={openSystemSettings}
                    />
                </View>
            ) : null}

            <Button
                title={t('notifications.test')}
                variant="secondary"
                className="mt-2"
                onPress={() => void sendTest()}
            />
            {feedback ? (
                <Text accessibilityLiveRegion="polite" className="text-sm text-muted-foreground">
                    {feedback}
                </Text>
            ) : null}
        </Card>
    );
}
