import type { PropheciesStats } from '@navis/shared';
import { Suspense } from 'react';
import { useTranslation } from 'react-i18next';

import { RateRing, Sparkline } from '@/components/prophecies/charts/lazy';
import { StatCard } from '@/components/prophecies/stat-card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatNumber } from '@/lib/format';

const LISTA = '/prophecies/list';

/**
 * Las seis tarjetas de la portada (RFC 0004 §7.3, D10).
 *
 * Cada una abre el listado con su filtro ya puesto en la URL: **la métrica es
 * la navegación**. La grande es la de la tasa, con el anillo y el reparto.
 */
export function StatGrid({ stats }: { stats: PropheciesStats }) {
  const { t } = useTranslation();
  const cumplidasPorMes = stats.monthly.map((month) => month.fulfilled);

  return (
    <div className="gap-4 sm:grid-cols-2 xl:grid-cols-3 grid">
      {/* La que abre el listado entero lleva la llamada escrita: «Ver mis
          profecías». Antes era un enlace pequeño y suelto bajo el gráfico, que
          no se veía y no se entendía. */}
      <StatCard
        to={LISTA}
        index={0}
        label={t('prophecies.stats.total')}
        value={formatNumber(stats.total)}
        cta={t('prophecies.open')}
        gradient="bg-gradient-to-br from-primary/8 to-transparent"
      >
        {/* El reparto entre los tres estados, como una sola barra. */}
        <span aria-hidden className="h-1.5 flex overflow-hidden rounded-full bg-muted">
          {(['espera', 'camino', 'cumplida'] as const).map((state) => (
            <span
              key={state}
              className={
                state === 'espera'
                  ? 'bg-muted-foreground/40'
                  : state === 'camino'
                    ? 'bg-primary'
                    : 'bg-success'
              }
              style={{
                width: `${String(stats.total === 0 ? 0 : (stats.byState[state] / stats.total) * 100)}%`,
              }}
            />
          ))}
        </span>
      </StatCard>

      <StatCard
        to={`${LISTA}?state=espera`}
        index={1}
        label={t('prophecies.stats.waiting')}
        value={formatNumber(stats.byState.espera)}
        hint={stats.longestWaiting?.title}
      />

      <StatCard
        to={`${LISTA}?state=camino`}
        index={2}
        label={t('prophecies.stats.onTheWay')}
        value={formatNumber(stats.byState.camino)}
      />

      <StatCard
        to={`${LISTA}?state=cumplida&window=year`}
        index={3}
        label={t('prophecies.stats.fulfilledThisYear')}
        value={formatNumber(stats.fulfilledThisYear)}
        wide
      >
        <Suspense fallback={<Skeleton className="h-6 w-full" />}>
          <Sparkline values={cumplidasPorMes} />
        </Suspense>
      </StatCard>

      <StatCard
        to={`${LISTA}?sort=received&order=asc`}
        index={4}
        label={t('prophecies.stats.typicalWait')}
        value={
          stats.medianWaitingDays === null
            ? t('prophecies.stats.noData')
            : t('prophecies.stats.typicalWaitValue', {
                days: formatNumber(stats.medianWaitingDays),
              })
        }
      />

      <StatCard
        to={`${LISTA}?state=cumplida`}
        index={5}
        label={t('prophecies.stats.rate')}
        value={
          <span className="gap-4 flex items-center">
            <Suspense fallback={<Skeleton className="h-22 w-22 rounded-full" />}>
              <RateRing rate={stats.fulfillmentRate} />
            </Suspense>
            <span className="text-sm font-normal text-muted-foreground tabular-nums">
              {stats.fulfillmentRate === null
                ? t('prophecies.stats.noRate')
                : `${formatNumber(stats.byState.cumplida)} / ${formatNumber(stats.total)}`}
            </span>
          </span>
        }
        gradient="bg-gradient-to-br from-success/10 via-primary/5 to-transparent"
        wide
      />
    </div>
  );
}
