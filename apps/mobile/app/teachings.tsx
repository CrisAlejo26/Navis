import { usePageBottomPadding } from '@/hooks/use-page-bottom-padding';
import { themeColorsHex } from '@navis/theme';
import { router } from 'expo-router';
import { ActivityIndicator, ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { TeachingMonthlyChart } from '@/components/teachings/teaching-monthly-chart';
import { TeachingStatCards } from '@/components/teachings/teaching-stat-cards';
import { AppBar } from '@/components/ui/app-bar';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { useTeachingsStats } from '@/hooks/use-teachings';
import { useThemeStore } from '@/lib/theme';

/**
 * La portada (plan `ensenanzas-movil-plan.md` §3): no repite la escena azul de
 * profecías y sueños. El nombre de la sección va en la barra superior, sobre una
 * franja `accent/10` (sin titular ni cifras repetidas: ya están en las tarjetas),
 * la tarjeta grande lleva el azul de marca con el % de checklist, y debajo la
 * gráfica de los últimos doce meses.
 */
export default function TeachingsScreen() {
    const bottomPadding = usePageBottomPadding();
    const { t } = useTranslation();
    const palette = themeColorsHex[useThemeStore((state) => state.resolvedTheme)];
    const { data: stats, isPending, isError, refetch } = useTeachingsStats();
    const add = () => router.push('/teachings/edit');

    if (isPending) {
        return (
            <View className="flex-1 bg-background">
                <AppBar title={t('teachings.title')} />
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator color={palette.primary} />
                </View>
            </View>
        );
    }

    if (isError) {
        return (
            <View className="flex-1 bg-background">
                <AppBar title={t('teachings.title')} />
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
            <ScrollView
                contentContainerClassName=""
                contentContainerStyle={{ paddingBottom: bottomPadding }}
                showsVerticalScrollIndicator={false}
            >
                <View className="rounded-b-3xl bg-accent/10">
                    <AppBar transparent title={t('teachings.title')} />
                </View>

                <View className="gap-4 p-4">
                    {stats.total === 0 ? (
                        <EmptyState
                            icon="school-outline"
                            title={t('teachings.emptyTitle')}
                            description={t('teachings.emptyBody')}
                        />
                    ) : (
                        <>
                            <TeachingStatCards stats={stats} />
                            <TeachingMonthlyChart monthly={stats.monthly} />
                        </>
                    )}
                    <Button title={t('teachings.add')} leadingIcon="add" size="lg" onPress={add} />
                    {stats.total > 0 ? (
                        <Button
                            title={t('teachings.open')}
                            variant="secondary"
                            onPress={() => router.push('/teachings/list')}
                        />
                    ) : null}
                </View>
            </ScrollView>
        </View>
    );
}
