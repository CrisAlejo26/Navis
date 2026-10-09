import Constants from 'expo-constants';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AccountCard } from '@/components/settings/account-card';
import { ChurchSettingsGroup } from '@/components/settings/church-settings-group';
import { DevToolsGroup } from '@/components/settings/dev-tools-group';
import { PreferencesGroup } from '@/components/settings/preferences-group';
import { SettingsGroup } from '@/components/settings/settings-group';
import { SettingsRow } from '@/components/settings/settings-row';
import { SignOutButton } from '@/components/settings/sign-out-button';
import { ThemePills } from '@/components/settings/theme-pills';
import { useLocalUser } from '@/hooks/use-settings';
import { usePageBottomPadding } from '@/hooks/use-page-bottom-padding';
import { useLocalSession } from '@/stores/local-session';
import { useSyncConnection } from '@/stores/sync-connection';

/**
 * El concentrador de ajustes: tarjetas de filas como las de Taskia, de lo más
 * cercano a la persona —apariencia y preferencias— a lo de toda la iglesia y
 * los datos. Sin formularios: cada uno vive en su pantalla. Cerrar sesión borra
 * solo la sesión; la cuenta y los datos siguen en el teléfono.
 */
export default function SettingsScreen() {
    const bottomPadding = usePageBottomPadding(true);
    const { t } = useTranslation();
    const insets = useSafeAreaInsets();
    const session = useLocalSession((state) => state.session);
    const clear = useLocalSession((state) => state.clear);
    const { data: user } = useLocalUser();
    const syncLink = useSyncConnection((state) => state.link);

    return (
        <ScrollView
            className="flex-1 bg-muted dark:bg-background"
            contentContainerStyle={{
                paddingTop: insets.top + 20,
                // La barra inferior ya reserva su altura fuera del ScrollView.
                paddingBottom: bottomPadding,
            }}
            showsVerticalScrollIndicator={false}
        >
            <View
                style={{
                    width: '100%',
                    maxWidth: 520,
                    alignSelf: 'center',
                    paddingHorizontal: 22,
                    gap: 24,
                }}
            >
                <Text
                    accessibilityRole="header"
                    className="text-3xl font-sans-semibold text-foreground"
                >
                    {t('settings.title')}
                </Text>

                <AccountCard
                    name={user?.name ?? ''}
                    email={user?.email ?? ''}
                    onPress={() => router.push('/settings/profile')}
                    label={t('profile.title')}
                />

                <SettingsGroup label={t('settings.appearance')}>
                    <ThemePills />
                </SettingsGroup>

                <PreferencesGroup />

                {session?.churchId ? <ChurchSettingsGroup /> : null}

                <SettingsGroup label={t('settings.groupData')}>
                    <SettingsRow
                        icon="save-outline"
                        title={t('backup.title')}
                        subtitle={t('backup.rowHint')}
                        onPress={() => router.push('/settings/backup')}
                    />
                    <SettingsRow
                        icon={syncLink ? 'link-outline' : 'phone-portrait-outline'}
                        title={t('settings.connection')}
                        subtitle={
                            syncLink
                                ? t('sync.rowLinked', { account: syncLink.account.email })
                                : t('settings.localMode')
                        }
                        value={syncLink ? t('sync.state.connected') : t('sync.state.local')}
                        onPress={() => router.push('/settings/connection')}
                    />
                </SettingsGroup>

                <DevToolsGroup />

                <SignOutButton
                    onConfirm={() => {
                        clear();
                        router.replace('/(auth)/welcome');
                    }}
                />

                <Text className="text-xs font-sans text-center text-muted-foreground">
                    Navis ·{' '}
                    {t('settings.version', { version: Constants.expoConfig?.version ?? '' })}
                </Text>
            </View>
        </ScrollView>
    );
}
