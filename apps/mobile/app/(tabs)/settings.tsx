import Constants from 'expo-constants';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScrollView, Text } from 'react-native';

import { ChurchSettingsGroup } from '@/components/settings/church-settings-group';
import { AccountCard } from '@/components/settings/account-card';
import { DevToolsGroup } from '@/components/settings/dev-tools-group';
import { PreferencesGroup } from '@/components/settings/preferences-group';
import { SettingsGroup } from '@/components/settings/settings-group';
import { SettingsRow } from '@/components/settings/settings-row';
import { SignOutButton } from '@/components/settings/sign-out-button';
import { ThemePills } from '@/components/settings/theme-pills';
import { useLocalChurch, useLocalUser } from '@/hooks/use-settings';
import { useLocalSession } from '@/stores/local-session';

/**
 * El concentrador de ajustes: tarjetas de filas como las de Taskia, de lo más
 * cercano a la persona —apariencia y preferencias— a lo de toda la iglesia y
 * los datos. Sin formularios: cada uno vive en su pantalla. Cerrar sesión borra
 * solo la sesión; la cuenta y los datos siguen en el teléfono.
 */
export default function SettingsScreen() {
    const { t } = useTranslation();
    const session = useLocalSession((state) => state.session);
    const clear = useLocalSession((state) => state.clear);
    const { data: user } = useLocalUser();
    const { data: church } = useLocalChurch();

    return (
        <ScrollView
            className="flex-1 bg-background"
            contentContainerClassName="gap-5 px-5 pb-32 pt-16"
            showsVerticalScrollIndicator={false}
        >
            <Text className="text-2xl font-semibold text-foreground">{t('settings.title')}</Text>

            <AccountCard
                name={user?.name ?? ''}
                email={user?.email ?? ''}
                churchName={church?.name}
            />

            <SettingsGroup label={t('settings.appearance')}>
                <ThemePills />
            </SettingsGroup>

            <PreferencesGroup />

            {session?.churchId ? <ChurchSettingsGroup name={church?.name} /> : null}

            <SettingsGroup label={t('settings.scopeYou')}>
                <SettingsRow
                    icon="person-outline"
                    title={t('profile.title')}
                    subtitle={t('profile.description')}
                    onPress={() => router.push('/settings/profile')}
                />
            </SettingsGroup>

            <SettingsGroup label={t('settings.groupData')}>
                <SettingsRow
                    icon="save-outline"
                    title={t('backup.title')}
                    subtitle={t('backup.rowHint')}
                    onPress={() => router.push('/settings/backup')}
                />
                <SettingsRow
                    icon="phone-portrait-outline"
                    title={t('settings.connection')}
                    subtitle={t('settings.localMode')}
                />
            </SettingsGroup>

            <SettingsGroup label={t('settings.about')}>
                <SettingsRow
                    icon="information-circle-outline"
                    title={t('settings.version', { version: Constants.expoConfig?.version ?? '' })}
                />
            </SettingsGroup>

            <SignOutButton
                onConfirm={() => {
                    clear();
                    router.replace('/(auth)/welcome');
                }}
            />

            <DevToolsGroup />
        </ScrollView>
    );
}
