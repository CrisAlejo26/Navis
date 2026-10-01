import { usePageBottomPadding } from '@/hooks/use-page-bottom-padding';
import { themeColorsHex } from '@navis/theme';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, View } from 'react-native';
import Animated, { useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';

import { DreamMonthlyChart, DreamWeekdayChart } from '@/components/dreams/dream-charts';
import { DreamFormSheet } from '@/components/dreams/dream-form-sheet';
import { DreamHero } from '@/components/dreams/dream-hero';
import { DreamStatCards } from '@/components/dreams/dream-stat-cards';
import { EmotionsMap } from '@/components/dreams/emotions-map';
import { AppBar } from '@/components/ui/app-bar';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { HeroScene } from '@/components/ui/hero-scene';
import { useDreamsStats } from '@/hooks/use-dreams';
import { useSaveDream } from '@/hooks/use-dream-save';
import { useStatusBarClaim } from '@/lib/status-bar';
import { useThemeStore } from '@/lib/theme';

/**
 * La portada de sueños (RFC 0005 §7.3), con la misma escena que la de
 * profecías (`HeroScene`): la franja de noches como firma, las seis tarjetas —
 * cada una lleva al listado con su filtro (D16)—, las dos gráficas y el mapa de
 * emociones. Portada y listado son dos pantallas, como en la web.
 */
export default function DreamsScreen() {
    const bottomPadding = usePageBottomPadding();
    const { t } = useTranslation();
    const resolvedTheme = useThemeStore((state) => state.resolvedTheme);
    const palette = themeColorsHex[resolvedTheme];
    const scrollY = useSharedValue(0);
    const onScroll = useAnimatedScrollHandler((event) => {
        scrollY.value = event.contentOffset.y;
    });
    const { data: stats, isPending, isError, refetch } = useDreamsStats();
    const [formOpen, setFormOpen] = useState(false);
    const save = useSaveDream();
    // Con la escena azul, iconos blancos; sin ella (carga, error, vacío) los del tema.
    const onScene = !isPending && !isError && !!stats && stats.total > 0;
    useStatusBarClaim(onScene ? 'light' : resolvedTheme === 'dark' ? 'light' : 'dark');

    if (isPending) {
        return (
            <View className="flex-1 bg-background">
                <AppBar title={t('dreams.title')} />
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator color={palette.primary} />
                </View>
            </View>
        );
    }

    if (isError || !stats) {
        return (
            <View className="flex-1 bg-background">
                <AppBar title={t('dreams.title')} />
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
                contentContainerClassName=""
                contentContainerStyle={{ paddingBottom: bottomPadding }}
                showsVerticalScrollIndicator={false}
            >
                {onScene ? (
                    <HeroScene scrollY={scrollY}>
                        <AppBar onScene title={t('dreams.title')} />
                        <DreamHero stats={stats} />
                    </HeroScene>
                ) : (
                    <AppBar title={t('dreams.title')} />
                )}
                <View className="gap-4 p-4">
                    {onScene ? (
                        <>
                            <DreamStatCards stats={stats} />
                            <DreamWeekdayChart days={stats.byWeekday} />
                            <DreamMonthlyChart monthly={stats.monthly} />
                            <EmotionsMap emotions={stats.byEmotion} />
                        </>
                    ) : (
                        <EmptyState
                            icon="moon-outline"
                            title={t('dreams.emptyTitle')}
                            description={t('dreams.emptyBody')}
                            action={{ label: t('dreams.add'), onPress: () => setFormOpen(true) }}
                        />
                    )}

                    <Button
                        title={t('dreams.add')}
                        onPress={() => setFormOpen(true)}
                        leadingIcon="add"
                        size="lg"
                    />
                    <Button
                        title={t('dreams.open')}
                        variant="secondary"
                        onPress={() => router.push('/dreams/list')}
                    />
                </View>
            </Animated.ScrollView>

            <DreamFormSheet
                visible={formOpen}
                onClose={() => setFormOpen(false)}
                dream={null}
                onSave={(values) => save(values, null)}
            />
        </View>
    );
}
