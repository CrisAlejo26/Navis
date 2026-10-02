import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Text, View } from 'react-native';
import { SettingsRow } from '@/components/settings/settings-row';
import { useMyChurches } from '@/hooks/use-my-churches';
import { useSwitchChurch } from '@/hooks/use-switch-church';
import { useLocalSession } from '@/stores/local-session';
import { ChurchRow } from './church-row';

export function ChurchList({ onClose = () => undefined }: { onClose?: () => void }) {
    const { t } = useTranslation();
    const churches = useMyChurches();
    const current = useLocalSession((state) => state.session?.churchId);
    const change = useSwitchChurch();
    const [failed, setFailed] = useState(false);
    async function select(id: string) {
        setFailed(false);
        if (id === current) {
            onClose();
            return;
        }
        try {
            await change.switchChurch(id);
            onClose();
        } catch {
            setFailed(true);
        }
    }
    return (
        <View>
            {churches.isPending ? (
                <ActivityIndicator accessibilityLabel={t('common.loading')} />
            ) : null}
            {churches.isError || failed ? (
                <Text accessibilityLiveRegion="polite" className="py-3 text-destructive">
                    {t('errors.generic')}
                </Text>
            ) : null}
            {churches.data?.length === 0 ? (
                <View className="gap-1 py-4">
                    <Text className="font-sans-semibold text-foreground">
                        {t('church.noneTitle')}
                    </Text>
                    <Text className="text-sm text-muted-foreground">{t('church.noneHint')}</Text>
                </View>
            ) : null}
            {churches.data?.map((church) => (
                <ChurchRow
                    key={church.id}
                    church={church}
                    current={church.id === current}
                    disabled={change.isPending}
                    onPress={() => void select(church.id)}
                />
            ))}
            <View className="mt-2 border-t border-border">
                <SettingsRow
                    icon="add-circle-outline"
                    title={t('church.add')}
                    subtitle={t('church.addHint')}
                    disabled={change.isPending}
                    onPress={() => {
                        onClose();
                        router.push('/settings/churches/new');
                    }}
                />
            </View>
        </View>
    );
}
