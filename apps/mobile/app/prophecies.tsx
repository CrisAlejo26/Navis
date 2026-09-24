import { themeColorsHex } from '@navis/theme';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, ScrollView, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { ProphecyFormSheet, toInput } from '@/components/prophecies/prophecy-form-sheet';
import { ProphecyHero } from '@/components/prophecies/prophecy-hero';
import { ProphecyMonthlyChart } from '@/components/prophecies/prophecy-monthly-chart';
import { ProphecyStatCards } from '@/components/prophecies/prophecy-stat-cards';
import { useCreateProphecy, useProphecyStats } from '@/hooks/use-prophecies';
import { useThemeStore } from '@/lib/theme';

/**
 * La portada (§4.5, §5 paso 3): el anillo de tasa como firma, las seis
 * tarjetas-filtro y el gráfico mensual — dos pantallas separadas, como D9 en
 * web: aquí las cuentas, en `/prophecies/list` el listado entero.
 */
export default function PropheciesScreen() {
    const { t } = useTranslation();
    const palette = themeColorsHex[useThemeStore((state) => state.resolvedTheme)];
    const { data: stats, isPending, isError, refetch } = useProphecyStats();
    const [formOpen, setFormOpen] = useState(false);
    const createProphecy = useCreateProphecy();

    if (isPending) {
        return (
            <View className="flex-1 items-center justify-center bg-background">
                <ActivityIndicator color={palette.primary} />
            </View>
        );
    }

    if (isError || !stats) {
        return (
            <EmptyState
                icon="cloud-offline-outline"
                title={t('errors.generic')}
                action={{ label: t('common.retry'), onPress: () => void refetch() }}
            />
        );
    }

    return (
        <View className="flex-1 bg-background">
            <ScrollView
                contentContainerClassName="gap-4 p-4 pb-10"
                showsVerticalScrollIndicator={false}
            >
                {stats.total === 0 ? (
                    <EmptyState
                        icon="sparkles-outline"
                        title={t('prophecies.emptyTitle')}
                        description={t('prophecies.emptyBody')}
                        action={{ label: t('prophecies.add'), onPress: () => setFormOpen(true) }}
                    />
                ) : (
                    <>
                        <ProphecyHero stats={stats} />
                        <ProphecyStatCards stats={stats} />
                        <ProphecyMonthlyChart monthly={stats.monthly} />
                    </>
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
            </ScrollView>

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
