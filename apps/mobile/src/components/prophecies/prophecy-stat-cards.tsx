import type { PropheciesStats } from '@navis/shared';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';

import { StatCard } from '@/components/ui/stat-card';
import { formatNumber } from '@/lib/format';

interface ProphecyStatCardsProps {
  stats: PropheciesStats;
}

/**
 * Las seis tarjetas-filtro de la portada (RFC 0004 D10): cada una navega al
 * listado ya con su filtro puesto. `rate` y `typicalWait` no tienen un campo
 * de filtro propio en `PropheciesQuery` —son cuentas, no un estado ni una
 * ventana— así que llevan a la lista entera.
 */
export function ProphecyStatCards({ stats }: ProphecyStatCardsProps) {
  const { t } = useTranslation();
  const waiting = stats.byState.espera;
  const onTheWay = stats.byState.camino;

  function goTo(params: Record<string, string>) {
    router.push({ pathname: '/prophecies/list', params });
  }

  return (
    <View className="gap-2.5 flex-row flex-wrap">
      <Card
        label={t('prophecies.stats.total')}
        value={formatNumber(stats.total)}
        icon="sparkles-outline"
        tone="accent"
        onPress={() => goTo({})}
      />
      <Card
        label={t('prophecies.stats.waiting')}
        value={formatNumber(waiting)}
        icon="hourglass-outline"
        tone="warning"
        onPress={() => goTo({ state: 'espera' })}
      />
      <Card
        label={t('prophecies.stats.onTheWay')}
        value={formatNumber(onTheWay)}
        icon="trail-sign-outline"
        tone="primary"
        onPress={() => goTo({ state: 'camino' })}
      />
      <Card
        label={t('prophecies.stats.fulfilledThisYear')}
        value={formatNumber(stats.fulfilledThisYear)}
        icon="flag-outline"
        tone="success"
        onPress={() => goTo({ state: 'cumplida' })}
      />
      <Card
        label={t('prophecies.stats.rate')}
        value={stats.fulfillmentRate === null ? '—' : `${Math.round(stats.fulfillmentRate * 100)}%`}
        icon="trending-up-outline"
        tone="success"
        onPress={() => goTo({})}
      />
      <Card
        label={t('prophecies.stats.typicalWait')}
        value={
          stats.medianWaitingDays === null
            ? '—'
            : t('prophecies.stats.typicalWaitValue', { days: stats.medianWaitingDays })
        }
        icon="time-outline"
        tone="warning"
        onPress={() => goTo({})}
      />
    </View>
  );
}

function Card({
  label,
  value,
  icon,
  tone,
  onPress,
}: {
  label: string;
  value: string;
  icon: Parameters<typeof StatCard>[0]['icon'];
  tone: Parameters<typeof StatCard>[0]['tone'];
  onPress: () => void;
}) {
  return (
    <Pressable className="flex-grow basis-[48%] active:opacity-80" onPress={onPress}>
      <StatCard label={label} value={value} icon={icon} tone={tone} />
    </Pressable>
  );
}
