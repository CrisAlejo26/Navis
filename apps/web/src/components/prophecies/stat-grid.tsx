import type { PropheciesStats } from '@navis/shared';
import { Clock, Sparkles } from 'lucide-react';
import { Suspense } from 'react';
import { useTranslation } from 'react-i18next';

import { RateRing, Sparkline } from '@/components/charts/lazy';
import { Skeleton } from '@/components/ui/skeleton';
import { StatCard } from '@/components/ui/stat-card';
import { formatNumber } from '@/lib/format';
import { STATE_ICON } from '@/lib/prophecies/state-icons';

const LISTA = '/prophecies/list';

/**
 * Las seis tarjetas de la portada (RFC 0004 §7.3, D10).
 *
 * Cada una abre el listado con su filtro ya puesto en la URL: **la métrica es
 * la navegación**. La grande es la de la tasa, con el anillo y el reparto.
 *
 * El color sigue las reglas de la RFC 0005 §7.1, que nacieron mirando
 * justamente esta pantalla: antes eran seis tarjetas `bg-card` con degradados
 * al 8 %, y sobre fondo claro eso es blanco. Ahora hay **una rellena** —el
 * total, que es el ancla— y tres con acento de verdad, cada una con el color de
 * su estado: ámbar lo que espera, azul lo que está en camino, verde lo
 * cumplido. Los colores salen de tokens, así que cambian solos entre el tema
 * claro y el oscuro (Regla 3 §2).
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
        tone="filled"
        Icon={Sparkles}
        label={t('prophecies.stats.total')}
        value={formatNumber(stats.total)}
        cta={t('prophecies.open')}
      >
        {/* El reparto entre los tres estados, como una sola barra. Sobre el
            relleno azul los tres colores de siempre no se distinguirían, así
            que aquí la barra se pinta en la pareja `-foreground`, con tres
            opacidades: es la misma información con el contraste de este fondo. */}
        <span
          aria-hidden
          className="h-1.5 flex overflow-hidden rounded-full bg-primary-foreground/20"
        >
          {(['espera', 'camino', 'cumplida'] as const).map((state) => (
            <span
              key={state}
              className={
                state === 'espera'
                  ? 'bg-primary-foreground/35'
                  : state === 'camino'
                    ? 'bg-primary-foreground/65'
                    : 'bg-primary-foreground'
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
        tone="accent"
        accent="accent"
        Icon={STATE_ICON.espera}
        label={t('prophecies.stats.waiting')}
        value={formatNumber(stats.byState.espera)}
        hint={stats.longestWaiting?.title}
      />

      <StatCard
        to={`${LISTA}?state=camino`}
        index={2}
        tone="accent"
        accent="primary"
        Icon={STATE_ICON.camino}
        label={t('prophecies.stats.onTheWay')}
        value={formatNumber(stats.byState.camino)}
      />

      <StatCard
        to={`${LISTA}?state=cumplida&window=year`}
        index={3}
        tone="accent"
        accent="success"
        Icon={STATE_ICON.cumplida}
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
        Icon={Clock}
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
