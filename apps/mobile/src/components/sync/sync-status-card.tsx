import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { formatMoment } from '@/lib/format';
import type { IoniconName } from '@/lib/nav-mobile';
import { syncRunner } from '@/lib/sync/device-runner';
import type { SyncRunState } from '@/lib/sync/engine';
import { useSyncStatus } from '@/stores/sync-status';

type Tone = 'success' | 'warning' | 'destructive';

/** Texto, icono y tono de cada resultado; el color refuerza, nunca informa solo. */
const STATES = {
    connected: { key: 'sync.run.connected', icon: 'checkmark-circle-outline', tone: 'success' },
    disabled: { key: 'sync.run.disabled', icon: 'time-outline', tone: 'warning' },
    conflicts: { key: 'sync.run.conflicts', icon: 'git-compare-outline', tone: 'warning' },
    lowStorage: { key: 'sync.run.lowStorage', icon: 'save-outline', tone: 'warning' },
    offline: { key: 'sync.run.offline', icon: 'cloud-offline-outline', tone: 'warning' },
    needsAuth: { key: 'sync.run.needsAuth', icon: 'key-outline', tone: 'destructive' },
    forbidden: { key: 'sync.run.forbidden', icon: 'lock-closed-outline', tone: 'warning' },
    rebase: { key: 'sync.run.rebase', icon: 'refresh-outline', tone: 'warning' },
    invalid: { key: 'sync.run.invalid', icon: 'alert-circle-outline', tone: 'destructive' },
} as const satisfies Record<SyncRunState, { key: string; icon: IoniconName; tone: Tone }>;

/** Cómo va la sincronización de este teléfono: qué falta por enviar, qué espera revisión y cuándo fue la última. */
export function SyncStatusCard() {
    const { t } = useTranslation();
    const status = useSyncStatus();
    const shown = status.state ? STATES[status.state] : null;

    useEffect(() => {
        void syncRunner.refresh();
    }, []);

    return (
        <View className="gap-4 p-4 rounded-[26px] bg-card">
            <View className="gap-3 flex-row items-start">
                <Icon
                    name={status.running ? 'sync-outline' : (shown?.icon ?? 'time-outline')}
                    tone={status.running ? 'primary' : (shown?.tone ?? 'warning')}
                    background="soft"
                    containerSize={38}
                />
                <View className="min-w-0 gap-1 flex-1">
                    <Text
                        accessibilityLiveRegion="polite"
                        className="font-sans-semibold text-[15px] text-foreground"
                    >
                        {status.running
                            ? t('sync.run.running')
                            : shown
                              ? t(shown.key)
                              : t('sync.neverSynced')}
                    </Text>
                    <Text className="text-xs font-sans text-muted-foreground">
                        {status.lastSyncAt
                            ? t('sync.lastSync', { when: formatMoment(status.lastSyncAt) })
                            : t('sync.neverSynced')}
                    </Text>
                </View>
            </View>

            <View className="gap-1">
                <Text className="text-sm font-sans text-foreground">
                    {t('sync.queuePending', { count: status.pending })}
                </Text>
                {status.conflicts > 0 ? (
                    <Text className="text-sm font-sans text-warning">
                        {t('sync.queueConflicts', { count: status.conflicts })}
                    </Text>
                ) : null}
                {status.rejected > 0 ? (
                    <Text className="text-sm font-sans text-destructive">
                        {t('sync.queueRejected', { count: status.rejected })}
                    </Text>
                ) : null}
            </View>

            <Button
                title={t('sync.syncNow')}
                variant="secondary"
                size="lg"
                loading={status.running}
                disabled={status.running}
                onPress={() => void syncRunner.syncNow({ manual: true }).catch(() => undefined)}
            />
        </View>
    );
}
