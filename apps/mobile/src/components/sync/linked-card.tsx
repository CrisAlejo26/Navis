import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { SettingsGroup } from '@/components/settings/settings-group';
import { SettingsRow } from '@/components/settings/settings-row';
import { Button } from '@/components/ui/button';
import { ConfirmationSheet } from '@/components/ui/confirmation-sheet';
import { Icon } from '@/components/ui/icon';
import { formatMediumDate } from '@/lib/format';
import { unlinkDevice } from '@/lib/sync/unlink-device';
import type { SyncLink } from '@/stores/sync-connection';

/** El teléfono ya está vinculado: a qué, con qué cuenta, y la salida de vuelta al modo local. */
export function LinkedCard({ link }: { link: SyncLink }) {
    const { t } = useTranslation();
    const [confirming, setConfirming] = useState(false);
    const [busy, setBusy] = useState(false);
    const [failed, setFailed] = useState(false);
    const host = new URL(link.apiUrl).host;

    async function disconnect(): Promise<void> {
        setBusy(true);
        const result = await unlinkDevice();
        setBusy(false);
        // Sin copia previa verificada no se desvincula: se avisa y se queda como estaba.
        setFailed(result.aborted);
        if (!result.aborted) setConfirming(false);
    }

    return (
        <View className="gap-6">
            <View className="gap-3 p-4 flex-row items-start rounded-[26px] bg-card">
                <Icon name="time-outline" tone="warning" background="soft" containerSize={38} />
                <View className="min-w-0 gap-1 flex-1">
                    <Text className="font-sans-semibold text-[15px] text-foreground">
                        {t('sync.linkedPending')}
                    </Text>
                    <Text className="text-sm font-sans text-muted-foreground">
                        {t('sync.linkedBody')}
                    </Text>
                </View>
            </View>

            <SettingsGroup label={t('sync.linkedTitle')}>
                <SettingsRow icon="globe-outline" title={link.installationName} subtitle={host} />
                <SettingsRow
                    icon="person-outline"
                    title={link.account.name}
                    subtitle={link.account.email}
                />
                <SettingsRow
                    icon="phone-portrait-outline"
                    title={link.deviceName}
                    subtitle={formatMediumDate(new Date(link.linkedAt))}
                />
            </SettingsGroup>

            <Button
                title={t('sync.disconnect')}
                variant="secondary"
                size="lg"
                onPress={() => {
                    setConfirming(true);
                }}
            />

            {confirming ? (
                <ConfirmationSheet
                    title={t('sync.disconnectTitle')}
                    description={`${t('sync.disconnectBody')} ${t('sync.disconnectedHint')}`}
                    confirmLabel={t('sync.disconnectConfirm')}
                    busy={busy}
                    failed={failed}
                    onConfirm={() => void disconnect()}
                    onCancel={() => {
                        setConfirming(false);
                    }}
                />
            ) : null}
        </View>
    );
}
