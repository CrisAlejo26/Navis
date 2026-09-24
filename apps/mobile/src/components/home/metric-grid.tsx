import type { DashboardAttentionPerson } from '@navis/shared';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { Panel } from '@/components/home/panel';
import { formatAgo, formatNumber } from '@/lib/format';

/**
 * El resumen del día en una rejilla 2×2 (RFC 0001, rediseño): creyentes,
 * nuevos, atención y racha, cada uno con su chip de icono — la traducción de
 * `StatusCard` al lenguaje de la referencia (rejilla 2×2 con pastillas de
 * icono), heredando la lista de «piden atención» que ya tenía.
 */
export function MetricGrid({
    believers,
    attention,
    streak,
}: {
    believers: { total: number; newThisMonth: number };
    attention: { count: number; people: readonly DashboardAttentionPerson[] };
    streak: number;
}) {
    const { t } = useTranslation();

    const tiles: {
        icon: Parameters<typeof Icon>[0]['name'];
        tone: Parameters<typeof Icon>[0]['tone'];
        label: string;
        value: string;
        href: string;
    }[] = [
        {
            icon: 'people',
            tone: 'primary',
            label: t('home.believers'),
            value: formatNumber(believers.total),
            href: '/believers',
        },
        {
            icon: 'person-add',
            tone: 'accent',
            label: t('home.newBelievers'),
            value: formatNumber(believers.newThisMonth),
            href: '/believers',
        },
        {
            icon: 'warning',
            tone: 'warning',
            label: t('home.attention'),
            value: formatNumber(attention.count),
            href: '/believers?attention=true',
        },
        {
            icon: 'flame',
            tone: 'success',
            label: t('home.streak'),
            value: formatNumber(streak),
            href: '/tasks',
        },
    ];

    return (
        <Panel>
            <Text className="text-sm font-semibold text-foreground">{t('home.todayTitle')}</Text>

            <View className="gap-2">
                <View className="gap-2 flex-row">
                    {tiles.slice(0, 2).map((tile) => (
                        <Tile key={tile.label} tile={tile} />
                    ))}
                </View>
                <View className="gap-2 flex-row">
                    {tiles.slice(2, 4).map((tile) => (
                        <Tile key={tile.label} tile={tile} />
                    ))}
                </View>
            </View>

            {attention.people.length > 0 && (
                <View className="gap-2.5 pt-3 border-t border-border">
                    {attention.people.map((person) => (
                        <Pressable
                            key={person.id}
                            onPress={() => router.push('/believers?attention=true')}
                            className="gap-2 flex-row items-center active:opacity-80"
                        >
                            <View className="h-7 w-7 items-center justify-center rounded-full bg-muted">
                                <Text className="text-xs font-medium text-muted-foreground">
                                    {person.name.trim().charAt(0).toUpperCase() || '?'}
                                </Text>
                            </View>
                            <Text className="text-sm flex-1 text-foreground" numberOfLines={1}>
                                {person.name}
                            </Text>
                            <Text className="text-xs text-muted-foreground">
                                {formatAgo(person.daysWithoutNote)}
                            </Text>
                        </Pressable>
                    ))}
                </View>
            )}
        </Panel>
    );
}

function Tile({
    tile,
}: {
    tile: {
        icon: Parameters<typeof Icon>[0]['name'];
        tone: Parameters<typeof Icon>[0]['tone'];
        label: string;
        value: string;
        href: string;
    };
}) {
    return (
        <Pressable
            onPress={() => router.push(tile.href)}
            className="gap-1.5 p-3 rounded-2xl flex-1 bg-muted active:opacity-80"
        >
            <Icon name={tile.icon} tone={tile.tone} background="soft" shape="square" size="sm" />
            <Text className="text-xs text-muted-foreground" numberOfLines={1}>
                {tile.label}
            </Text>
            <Text className="text-xl font-sans-semibold text-foreground tabular-nums">
                {tile.value}
            </Text>
        </Pressable>
    );
}
