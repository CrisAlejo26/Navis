import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SettingsGroup } from './settings-group';
import { SettingsRow } from './settings-row';
import { useMyChurches } from '@/hooks/use-my-churches';
import { ChurchPlate } from '@/components/church/church-plate';

export function ChurchSettingsGroup({ name }: { name?: string }) {
    const { t } = useTranslation();
    const { data: churches } = useMyChurches();
    return (
        <SettingsGroup label={t('settings.church')}>
            <ChurchPlate />
            <SettingsRow
                icon="boat-outline"
                title={t('settings.churchData')}
                subtitle={name}
                onPress={() => router.push('/settings/church')}
            />
            <SettingsRow
                icon="albums-outline"
                title={t('church.mine')}
                value={String(churches?.length ?? 0)}
                onPress={() => router.push('/settings/churches')}
            />
            <SettingsRow
                icon="calendar-outline"
                title={t('calendar.settings')}
                onPress={() => router.push('/calendar/settings')}
            />
            <SettingsRow
                icon="pricetags-outline"
                title={t('settings.believersCatalog')}
                subtitle={t('settings.believersCatalogHint')}
                onPress={() => router.push('/believers/catalog')}
            />
        </SettingsGroup>
    );
}
