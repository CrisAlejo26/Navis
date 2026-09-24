import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScrollView, Text, View } from 'react-native';

import { LanguageSelect } from '@/components/language-select';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CardGroup } from '@/components/ui/card-group';
import { Icon } from '@/components/ui/icon';
import { ListRow } from '@/components/ui/list-row';
import { hasDemoData, seedDemoData } from '@/data/demo-data';
import { findUser } from '@/data/repos/account-repo';
import { useLocalSession } from '@/stores/local-session';

/**
 * Los ajustes, con la sesión **local** (RFC 0024, Fase 1): cerrar sesión
 * borra solo la sesión — la cuenta y los datos siguen en el teléfono.
 *
 * Mientras la app está en desarrollo, aquí vive el botón de **datos de
 * prueba** (Regla 11): siembra doce hermanos con notas y etiquetas para ver
 * la interfaz llena. Desaparece en cuanto hay creyentes en la base.
 */
export default function SettingsScreen() {
    const { t } = useTranslation();
    const session = useLocalSession((state) => state.session);
    const clear = useLocalSession((state) => state.clear);
    const client = useQueryClient();

    const { data: user } = useQuery({
        queryKey: ['local-user', session?.userId],
        queryFn: () => findUser(session!.userId),
        enabled: Boolean(session),
    });

    const { data: seeded } = useQuery({
        queryKey: ['demo-data', session?.churchId],
        queryFn: () => hasDemoData(session!.churchId!),
        enabled: Boolean(session?.churchId),
    });

    const seed = useMutation({
        mutationFn: () => {
            if (!session?.churchId) throw new Error('Sin iglesia activa no se siembra');
            return seedDemoData(session.churchId, session.userId);
        },
        onSuccess: () => {
            void client.invalidateQueries({ queryKey: ['demo-data'] });
            void client.invalidateQueries({ queryKey: ['believers'] });
            void client.invalidateQueries({ queryKey: ['dashboard'] });
            void client.invalidateQueries({ queryKey: ['catalog'] });
        },
    });

    function onSignOut(): void {
        clear();
        router.replace('/(auth)/welcome');
    }

    return (
        <ScrollView className="flex-1 bg-background" contentContainerClassName="gap-4 p-4 pt-16">
            <Text className="text-2xl font-semibold text-foreground">{t('settings.title')}</Text>

            <Card title={t('settings.appearance')}>
                <View className="gap-4 pt-2">
                    <View className="gap-2">
                        <Text className="text-sm text-muted-foreground">{t('theme.label')}</Text>
                        <ThemeToggle />
                    </View>
                    <View className="gap-2">
                        <Text className="text-sm text-muted-foreground">{t('language.label')}</Text>
                        <LanguageSelect />
                    </View>
                </View>
            </Card>

            <Card title={t('settings.profile')} description={user?.email}>
                <Button
                    title={t('auth.signOut')}
                    variant="secondary"
                    className="mt-2"
                    onPress={onSignOut}
                />
            </Card>

            {/* El modo local guarda todo en el teléfono; la conexión al servidor
          llega con la Fase 3 del RFC 0024. */}
            <Card title={t('settings.connection')} description={t('settings.localMode')} />

            {seeded ? null : (
                <Card title={t('settings.demoTitle')} description={t('settings.demoDescription')}>
                    <Button
                        title={t('settings.demoSeed')}
                        loading={seed.isPending}
                        className="mt-2"
                        onPress={() => seed.mutate()}
                    />
                </Card>
            )}

            <CardGroup>
                <ListRow
                    leading={<Icon name="grid" tone="primary" background="soft" />}
                    title={t('catalog.title')}
                    subtitle={t('catalog.subtitle')}
                    onPress={() => router.push('/components')}
                />
            </CardGroup>
        </ScrollView>
    );
}
