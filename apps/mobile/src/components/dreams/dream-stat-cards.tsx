import type { DreamsStats } from '@navis/shared';
import { router } from 'expo-router';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { StatCard } from '@/components/ui/stat-card';
import { formatDay, formatNumber } from '@/lib/format';

type Card = Parameters<typeof StatCard>[0];

/**
 * Las seis tarjetas de la portada (RFC 0005 §7.3), a juego con las de
 * profecías: cada una abre el listado con su filtro ya puesto (D16) —la
 * métrica es la navegación—, salvo la racha, que es una cuenta y no un
 * filtro. La del último cumplido lleva a la ficha de ese sueño.
 */
export function DreamStatCards({ stats }: { stats: DreamsStats }) {
    const { t } = useTranslation();
    const last = stats.lastFulfilled;

    function goTo(params: Record<string, string>) {
        router.push({ pathname: '/dreams/list', params });
    }

    return (
        <View className="gap-2.5 flex-row flex-wrap">
            <Item
                label={t('dreams.stats.total')}
                value={formatNumber(stats.total)}
                icon="moon-outline"
                tone="accent"
                onPress={() => goTo({})}
            />
            <Item
                label={t('dreams.stats.thisMonth')}
                value={formatNumber(stats.thisMonth)}
                icon="calendar-outline"
                tone="primary"
                onPress={() => goTo({ from: `${stats.monthly.at(-1)?.month ?? ''}-01` })}
            />
            <Item
                label={t('dreams.stats.thisWeek')}
                value={formatNumber(stats.thisWeek)}
                icon="partly-sunny-outline"
                tone="warning"
                onPress={() => goTo({ from: stats.weeks.at(-1)?.weekStart ?? '' })}
            />
            <Item
                label={t('dreams.stats.fulfilled')}
                value={formatNumber(stats.fulfilled)}
                icon="sunny-outline"
                tone="success"
                onPress={() => goTo({ state: 'cumplido' })}
            />
            <Item
                label={t('dreams.stats.streak')}
                value={formatNumber(stats.streak)}
                icon="flame-outline"
                tone="warning"
            />
            <Item
                label={t('dreams.stats.lastFulfilled')}
                value={last ? formatDay(last.fulfilledAt, 'short') : '—'}
                icon="flag-outline"
                tone="success"
                onPress={last ? () => router.push(`/dreams/${last.id}`) : undefined}
            />
        </View>
    );
}

function Item({ onPress, ...card }: Card & { onPress?: () => void }) {
    return (
        <Pressable
            className="flex-grow basis-[48%] active:opacity-80"
            disabled={!onPress}
            onPress={onPress}
        >
            <StatCard {...card} tinted className="flex-1" />
        </Pressable>
    );
}
