import { prophecyState, waitingDays, type Prophecy, type ProphecyListItem } from '@navis/shared';
import { useTranslation } from 'react-i18next';

import { TravesiaTrack } from '@/components/prophecies/travesia-track';
import { formatDate } from '@/lib/format';
import { percentOf, travesiaRange } from '@/lib/prophecies/travesia';

/**
 * El **recorrido** de esta profecía: su trayecto en el tiempo, y debajo cada
 * cumplimiento anclado a su fecha (RFC 0004 §7.6).
 *
 * Reutiliza el mismo trazado que la travesía del listado en vez de dibujar
 * otro: es la misma idea a otra escala, y tener dos versiones del elemento
 * firma sería tener una que se queda vieja (Regla 1).
 */
export function ProphecyJourney({ prophecy, today }: { prophecy: Prophecy; today: string }) {
  const { t } = useTranslation();

  // La fila que espera `TravesiaTrack`, montada a partir de la ficha: el eje va
  // del día en que se recibió hasta hoy, que es el recorrido de esta sola.
  const item: ProphecyListItem = {
    id: prophecy.id,
    title: prophecy.title,
    excerpt: '',
    receivedAt: prophecy.receivedAt,
    fulfilledAt: prophecy.fulfilledAt,
    lastFulfillmentAt: prophecy.lastFulfillmentAt,
    state: prophecyState(prophecy),
    waitingDays: waitingDays(prophecy, today),
    fulfillmentsCount: prophecy.fulfillments.length,
    fulfillmentDays: prophecy.fulfillments.map((one) => one.occurredAt),
  };
  const range = travesiaRange([item], today);
  const ordenados = [...prophecy.fulfillments].sort((a, b) =>
    a.occurredAt.localeCompare(b.occurredAt),
  );

  return (
    <div className="gap-5 p-4 sm:p-6 flex flex-col rounded-xl border bg-card">
      <div className="gap-2 flex flex-col">
        <div aria-hidden className="h-4 relative">
          {range.years.map((year) => (
            <span
              key={year}
              className="top-0 absolute -translate-x-1/2 text-[10px] text-muted-foreground tabular-nums"
              style={{ left: percentOf(`${String(year)}-01-01`, range) }}
            >
              {year}
            </span>
          ))}
        </div>

        <TravesiaTrack item={item} range={range} index={0} />

        <div className="text-xs flex justify-between text-muted-foreground tabular-nums">
          <span>{t('prophecies.receivedOn', { date: formatDate(prophecy.receivedAt) })}</span>
          {prophecy.fulfilledAt && (
            <span>{t('prophecies.fulfilledOn', { date: formatDate(prophecy.fulfilledAt) })}</span>
          )}
        </div>
      </div>

      {ordenados.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t('prophecies.fulfillmentsEmpty')}</p>
      ) : (
        <ol className="gap-3 flex flex-col">
          {ordenados.map((fulfillment, index) => (
            <li
              key={fulfillment.id}
              style={{ animationDelay: `${String(index * 60)}ms` }}
              className="gap-3 p-3 animate-rise-in flex items-start rounded-lg border bg-background/40"
            >
              <span className="w-20 font-medium shrink-0 text-[11px] text-muted-foreground tabular-nums">
                {formatDate(fulfillment.occurredAt, 'short')}
              </span>
              <p className="text-sm min-w-0 leading-relaxed whitespace-pre-wrap">
                {fulfillment.text}
              </p>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
