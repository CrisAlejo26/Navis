import type { ProphecyListItem } from '@navis/shared';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { StateBadge } from '@/components/prophecies/state-badge';
import { TravesiaTrack } from '@/components/prophecies/travesia-track';
import { formatDay, formatNumber } from '@/lib/format';
import { percentOf, travesiaRange } from '@/lib/prophecies/travesia';

/**
 * **La travesía**: el elemento firma de la sección (RFC 0004 §7.5).
 *
 * Cada profecía es un trayecto en el tiempo sobre un eje compartido. Es la
 * única vista que enseña la espera **como longitud**, que es justo la pregunta
 * de esta pantalla: qué ha pasado con lo que se recibió, y cuánto lleva
 * esperando lo que todavía no ha pasado.
 */
export function Travesia({ items, today }: { items: ProphecyListItem[]; today: string }) {
  const { t } = useTranslation();
  const range = travesiaRange(items, today);

  return (
    <div className="p-4 sm:p-5 rounded-xl border bg-card">
      {/* El eje, rotulado por años y compartido por todas las filas. */}
      <div aria-hidden className="mb-3 h-4 ml-0 sm:ml-44 relative">
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

      <ul className="flex flex-col">
        {items.map((item, index) => (
          <li
            key={item.id}
            // La fila entra escalonada y, dentro, su trayecto se dibuja: son
            // dos capas de la misma cascada (§7.8).
            style={{ animationDelay: `${String(Math.min(index, 12) * 40)}ms` }}
            className="gap-1 py-2.5 sm:gap-4 sm:flex-row sm:items-center animate-rise-in flex flex-col border-t"
          >
            <div className="min-w-0 sm:w-44 sm:shrink-0">
              <Link
                to={`/prophecies/${item.id}`}
                className="font-medium block truncate text-[15px] hover:underline"
              >
                {item.title}
              </Link>
              {/* La fecha, a la vista: en esta vista solo estaba en la
                  etiqueta accesible, así que quien la miraba veía el trayecto
                  pero no **cuándo** empezó. */}
              <div className="gap-2 mt-0.5 flex flex-wrap items-center">
                <StateBadge state={item.state} className="px-0 border-none" />
                <span className="text-xs text-muted-foreground tabular-nums">
                  {formatDay(item.receivedAt)}
                </span>
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <TravesiaTrack item={item} range={range} index={index} />
              {/* Lo que de verdad se lee: el trazado va `aria-hidden`. */}
              <span className="sr-only">
                {t('prophecies.trackLabel', {
                  date: formatDay(item.receivedAt),
                  state: t(`prophecies.state.${item.state}`),
                  days: formatNumber(item.waitingDays),
                })}
              </span>
            </div>

            <span className="text-xs shrink-0 text-muted-foreground tabular-nums">
              {item.fulfilledAt
                ? t('prophecies.waitedFor', { days: formatNumber(item.waitingDays) })
                : t('prophecies.waitingFor', { days: formatNumber(item.waitingDays) })}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
