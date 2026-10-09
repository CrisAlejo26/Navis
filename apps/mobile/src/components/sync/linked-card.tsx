import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { SettingsGroup } from '@/components/settings/settings-group';
import { SettingsRow } from '@/components/settings/settings-row';
import { Button } from '@/components/ui/button';
import { router } from 'expo-router';
import { SyncStatusCard } from '@/components/sync/sync-status-card';
import { ConfirmationSheet } from '@/components/ui/confirmation-sheet';
import { formatMediumDate } from '@/lib/format';
import { unlinkDevice } from '@/lib/sync/unlink-device';
import type { SyncLink } from '@/stores/sync-connection';
import { useSyncStatus } from '@/stores/sync-status';

/** El teléfono ya está vinculado: a qué, con qué cuenta, y la salida de vuelta al modo local. */
export function LinkedCard({ link }: { link: SyncLink }) {
    const { t } = useTranslation();
    const [confirming, setConfirming] = useState(false);
    const [busy, setBusy] = useState(false);
    const [failed, setFailed] = useState(false);
    const host = new URL(link.apiUrl).host;
    const conflicts = useSyncStatus((state) => state.conflicts);

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
            <SyncStatusCard />

            <SettingsGroup label={t('sync.reviewConflicts')}>
                <SettingsRow
                    icon="git-compare-outline"
                    title={t('sync.reviewConflicts')}
                    value={conflicts > 0 ? String(conflicts) : undefined}
                    onPress={() => router.push('/settings/conflicts')}
                />
                <SettingsRow
                    icon="people-outline"
                    title={t('sync.reviewDuplicates')}
                    onPress={() => router.push('/settings/duplicates')}
                />
            </SettingsGroup>

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
