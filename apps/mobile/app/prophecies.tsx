import { themeColorsHex } from '@navis/theme';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, View } from 'react-native';
import Animated, { useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';

import { AppBar } from '@/components/ui/app-bar';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { HeroScene } from '@/components/ui/hero-scene';
import { ProphecyFormSheet, toInput } from '@/components/prophecies/prophecy-form-sheet';
import { ProphecyHero } from '@/components/prophecies/prophecy-hero';
import { ProphecyMonthlyChart } from '@/components/prophecies/prophecy-monthly-chart';
import { ProphecyStatCards } from '@/components/prophecies/prophecy-stat-cards';
import { useCreateProphecy, useProphecyStats } from '@/hooks/use-prophecies';
import { useStatusBarClaim } from '@/lib/status-bar';
import { useThemeStore } from '@/lib/theme';

/**
 * La portada (§4.5, §5 paso 3): el anillo de tasa como firma, las seis
 * tarjetas-filtro y el gráfico mensual — dos pantallas separadas, como D9 en
 * web: aquí las cuentas, en `/prophecies/list` el listado entero.
 */
export default function PropheciesScreen() {
    const { t } = useTranslation();
    const resolvedTheme = useThemeStore((state) => state.resolvedTheme);
    const palette = themeColorsHex[resolvedTheme];
    const scrollY = useSharedValue(0);
    const onScroll = useAnimatedScrollHandler((event) => {
        scrollY.value = event.contentOffset.y;
    });
    const { data: stats, isPending, isError, refetch } = useProphecyStats();
    const [formOpen, setFormOpen] = useState(false);
    const createProphecy = useCreateProphecy();
    // Con la escena azul, iconos blancos; sin ella (carga, error, vacío) los del tema.
    const onScene = !isPending && !isError && !!stats && stats.total > 0;
    useStatusBarClaim(onScene ? 'light' : resolvedTheme === 'dark' ? 'light' : 'dark');

    if (isPending) {
        return (
            <View className="flex-1 bg-background">
                <AppBar title={t('prophecies.title')} />
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator color={palette.primary} />
                </View>
            </View>
        );
    }

    if (isError || !stats) {
        return (
            <View className="flex-1 bg-background">
                <AppBar title={t('prophecies.title')} />
                <EmptyState
                    icon="cloud-offline-outline"
                    title={t('errors.generic')}
                    action={{ label: t('common.retry'), onPress: () => void refetch() }}
                />
            </View>
        );
    }

    return (
        <View className="flex-1 bg-background">
            <Animated.ScrollView
                onScroll={onScroll}
                scrollEventThrottle={16}
                contentContainerClassName="pb-10"
                showsVerticalScrollIndicator={false}
            >
                {onScene ? (
                    <HeroScene scrollY={scrollY}>
                        <AppBar onScene title={t('prophecies.title')} />
                        <ProphecyHero stats={stats} />
                    </HeroScene>
                ) : (
                    <AppBar title={t('prophecies.title')} />
                )}
                <View className="gap-4 p-4">
                    {onScene ? (
                        <>
                            <ProphecyStatCards stats={stats} />
                            <ProphecyMonthlyChart monthly={stats.monthly} />
                        </>
                    ) : (
                        <EmptyState
                            icon="sparkles-outline"
                            title={t('prophecies.emptyTitle')}
                            description={t('prophecies.emptyBody')}
                            action={{
                                label: t('prophecies.add'),
                                onPress: () => setFormOpen(true),
                            }}
                        />
                    )}

                    <Button
                        title={t('prophecies.add')}
                        onPress={() => setFormOpen(true)}
                        leadingIcon="add"
                        size="lg"
                    />
                    <Button
                        title={t('prophecies.open')}
                        variant="secondary"
                        onPress={() => router.push('/prophecies/list')}
                    />
                </View>
            </Animated.ScrollView>

            <ProphecyFormSheet
                visible={formOpen}
                onClose={() => setFormOpen(false)}
                prophecy={null}
                onSave={async (values) => {
                    await createProphecy.mutateAsync(toInput(values));
                }}
            />
        </View>
    );
}
