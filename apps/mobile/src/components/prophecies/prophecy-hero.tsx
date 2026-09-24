import type { PropheciesStats } from '@navis/shared';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ProgressRing } from '@/components/ui/progress-ring';
import { formatNumber } from '@/lib/format';

interface ProphecyHeroProps {
    stats: PropheciesStats;
}

/**
 * La cabecera de la portada (docs/profecias-movil-plan.md §3.2): el anillo de
 * tasa de cumplimiento como firma —se anima de 0 a su valor solo al montar,
 * comportamiento ya de `ProgressRing`— y la frase con los tres totales
 * (`prophecies.lead`), reutilizada tal cual de las claves ya traducidas.
 */
export function ProphecyHero({ stats }: ProphecyHeroProps) {
    const { t } = useTranslation();
    const waiting = stats.byState.espera + stats.byState.camino;

    return (
        <View className="gap-3 py-4 items-center">
            <ProgressRing
                progress={stats.fulfillmentRate ?? 0}
                size={140}
                strokeWidth={12}
                tone="success"
                label={
                    stats.fulfillmentRate === null
                        ? '—'
                        : `${Math.round(stats.fulfillmentRate * 100)}%`
                }
            />
            <Text className="text-sm text-center text-muted-foreground">
                {stats.fulfillmentRate === null
                    ? t('prophecies.stats.noRate')
                    : t('prophecies.stats.rate')}
            </Text>
            <Text className="text-base font-sans-medium text-center text-foreground">
                {t('prophecies.lead', {
                    total: formatNumber(stats.total),
                    waiting: formatNumber(waiting),
                    fulfilled: formatNumber(stats.byState.cumplida),
                })}
            </Text>
        </View>
    );
}
