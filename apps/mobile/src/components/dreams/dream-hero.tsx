import type { DreamsStats } from '@navis/shared';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { NightsStrip } from '@/components/dreams/nights-strip';
import { ProgressRing } from '@/components/ui/progress-ring';
import { formatNumber } from '@/lib/format';

/**
 * La cabecera de la portada, sobre la escena azul de profecías (`HeroScene`,
 * misma pieza): el anillo con la proporción de sueños cumplidos y la frase con
 * los tres totales (`dreams.lead`), y debajo la franja de noches, que es la
 * firma de la pantalla (RFC 0005 D19). El anillo se anima de 0 a su valor solo
 * al montar, comportamiento ya de `ProgressRing`.
 */
export function DreamHero({ stats }: { stats: DreamsStats }) {
    const { t } = useTranslation();
    const rate = stats.total === 0 ? 0 : stats.fulfilled / stats.total;

    return (
        <View>
            <View className="gap-4 px-4 pt-2 pb-6 flex-row items-center">
                <ProgressRing
                    progress={rate}
                    size={104}
                    strokeWidth={10}
                    onScene
                    label={`${Math.round(rate * 100)}%`}
                />
                <View className="gap-1 min-w-0 flex-1">
                    <Text className="text-sm" style={{ color: 'rgba(255, 255, 255, 0.85)' }}>
                        {t('dreams.stats.fulfilled')}
                    </Text>
                    <Text className="text-base font-sans-medium" style={{ color: '#ffffff' }}>
                        {t('dreams.lead', {
                            total: formatNumber(stats.total),
                            month: formatNumber(stats.thisMonth),
                            fulfilled: formatNumber(stats.fulfilled),
                        })}
                    </Text>
                </View>
            </View>
            <NightsStrip nights={stats.nights} />
        </View>
    );
}
