import type { TeachingsStats } from '@navis/shared';
import { brandColorHex } from '@navis/theme';
import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ProgressRing } from '@/components/ui/progress-ring';
import { StatCard } from '@/components/ui/stat-card';
import { formatNumber } from '@/lib/format';

const LIST = '/teachings/list';

/**
 * Las tarjetas de la portada (RFC 0022 §3): la grande va en el **azul de
 * marca**, no en el de los controles, porque enseña la cifra que ningún otro
 * módulo tiene — cuánto de la checklist está hecho — y las otras dos van en
 * `accent`, para que la pantalla no se quede en blanco y gris.
 */
export function TeachingStatCards({ stats }: { stats: TeachingsStats }) {
    const { t } = useTranslation();
    const rate = stats.checklistRate;

    return (
        <View className="gap-3">
            <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('teachings.open')}
                onPress={() => router.push(LIST)}
                className="gap-4 p-5 rounded-2xl flex-row items-center active:opacity-90"
                style={{ backgroundColor: brandColorHex }}
            >
                <ProgressRing
                    onScene
                    size={84}
                    strokeWidth={8}
                    progress={rate ?? 0}
                    label={rate === null ? '—' : `${String(Math.round(rate * 100))}%`}
                />
                <View className="gap-1 min-w-0 flex-1">
                    <Text className="text-sm text-white/80">{t('teachings.stats.checklist')}</Text>
                    <Text className="text-xl font-sans-semibold text-white tabular-nums">
                        {stats.checklistTotal === 0
                            ? t('teachings.stats.noData')
                            : t('teachings.stats.checklistValue', {
                                  checked: formatNumber(stats.checklistChecked),
                                  total: formatNumber(stats.checklistTotal),
                              })}
                    </Text>
                </View>
            </Pressable>

            <View className="gap-3 flex-row">
                <Pressable onPress={() => router.push(LIST)} className="flex-1">
                    <StatCard
                        tinted
                        tone="accent"
                        icon="school-outline"
                        label={t('teachings.stats.totalLabel')}
                        value={formatNumber(stats.total)}
                    />
                </Pressable>
                <Pressable onPress={() => router.push(LIST)} className="flex-1">
                    <StatCard
                        tinted
                        tone="success"
                        icon="calendar-outline"
                        label={t('teachings.stats.thisYearLabel')}
                        value={formatNumber(stats.thisYear)}
                    />
                </Pressable>
            </View>
        </View>
    );
}
