import type { DreamsStats } from '@navis/shared';
import { CalendarDays, CheckCheck, Flame, MoonStar } from 'lucide-react';
import { Suspense } from 'react';
import { useTranslation } from 'react-i18next';

import { Sparkline } from '@/components/charts/lazy';
import { Skeleton } from '@/components/ui/skeleton';
import { StatCard } from '@/components/ui/stat-card';
import { formatDay, formatNumber } from '@/lib/format';

const LISTA = '/dreams/list';

/**
 * Las tarjetas de la portada (RFC 0005 §7.3).
 *
 * Cada una abre el listado con su filtro ya puesto en la URL: **la métrica es
 * la navegación** (D16). Y el color va por niveles (§7.1): **una sola rellena**
 * —el total, que es el ancla—, las demás con su acento, y el gráfico ancho al
 * final. Seis rectángulos azules serían el cuadro de mandos de plantilla.
 */
export function StatGrid({ stats }: { stats: DreamsStats }) {
  const { t } = useTranslation();
  const porMes = stats.monthly.map((month) => month.count);

  return (
    <div className="gap-4 sm:grid-cols-2 xl:grid-cols-4 grid">
      <StatCard
        to={LISTA}
        index={0}
        tone="filled"
        Icon={MoonStar}
        label={t('dreams.stats.total')}
        value={formatNumber(stats.total)}
        cta={t('dreams.open')}
      />

      <StatCard
        to={`${LISTA}?from=${stats.monthly.at(-1)?.month ?? ''}-01`}
        index={1}
        tone="accent"
        accent="primary"
        Icon={CalendarDays}
        label={t('dreams.stats.thisMonth')}
        value={formatNumber(stats.thisMonth)}
      >
        <Suspense fallback={<Skeleton className="h-6 w-full" />}>
          <Sparkline values={porMes} tone="primary" />
        </Suspense>
      </StatCard>

      <StatCard
        to={`${LISTA}?from=${stats.weeks.at(-1)?.weekStart ?? ''}`}
        index={2}
        tone="accent"
        accent="warning"
        Icon={Flame}
        label={t('dreams.stats.thisWeek')}
        value={formatNumber(stats.thisWeek)}
        hint={stats.streak > 0 ? t('dreams.stats.streakValue', { total: stats.streak }) : undefined}
      />

      <StatCard
        to={`${LISTA}?state=cumplido`}
        index={3}
        tone="accent"
        accent="success"
        Icon={CheckCheck}
        label={t('dreams.stats.fulfilled')}
        value={formatNumber(stats.fulfilled)}
        hint={
          stats.lastFulfilled
            ? t('dreams.fulfilledOn', { date: formatDay(stats.lastFulfilled.fulfilledAt) })
            : undefined
        }
      />
    </div>
  );
}
