import type { ProphecyListItem } from '@navis/shared';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { formatDate } from '@/lib/format';

/** Los doce meses del año, como índices. El nombre lo pone `Intl`. */
const MONTHS = Array.from({ length: 12 }, (_, index) => index);

/**
 * El año en cuadrícula (RFC 0004 §7.5).
 *
 * Cada palabra es un punto en el mes que le toca: en `primary` la que se
 * recibió, en `success` la que se cumplió. Es la vista que **enseña lo que no
 * hay** — los meses en blanco, que en una lista no se ven porque una lista solo
 * enseña lo que existe.
 */
export function PropheciesYear({ items, today }: { items: ProphecyListItem[]; today: string }) {
  const { t, i18n } = useTranslation();
  const years = [...new Set(items.map((one) => one.receivedAt.slice(0, 4)))].sort().reverse();
  const nombreDeMes = new Intl.DateTimeFormat(i18n.language, { month: 'short' });

  return (
    <div className="gap-6 p-4 sm:p-5 flex flex-col rounded-xl border bg-card">
      {years.length === 0 && (
        <p className="py-8 text-sm text-center text-muted-foreground">
          {t('prophecies.stats.noData')}
        </p>
      )}

      {years.map((year, index) => (
        <section
          key={year}
          style={{ animationDelay: `${String(Math.min(index, 8) * 70)}ms` }}
          className="gap-2 animate-rise-in flex flex-col"
        >
          <h3 className="text-xs font-medium text-muted-foreground tabular-nums">{year}</h3>

          <div className="gap-1.5 sm:grid-cols-6 lg:grid-cols-12 grid grid-cols-3">
            {MONTHS.map((month) => {
              const key = `${year}-${String(month + 1).padStart(2, '0')}`;
              const recibidas = items.filter((one) => one.receivedAt.startsWith(key));
              const cumplidas = items.filter((one) => one.fulfilledAt?.startsWith(key));

              return (
                <div
                  key={key}
                  className="gap-1 p-1.5 min-h-16 flex flex-col rounded-md border bg-background/40"
                >
                  <span aria-hidden className="text-[10px] text-muted-foreground">
                    {nombreDeMes.format(new Date(Number(year), month, 1))}
                  </span>

                  <div className="gap-1 flex flex-wrap">
                    {recibidas.map((one) => (
                      <Link
                        key={`r-${one.id}`}
                        to={`/prophecies/${one.id}`}
                        title={`${one.title} · ${t('prophecies.receivedOn', { date: formatDate(one.receivedAt) })}`}
                        aria-label={`${one.title}: ${t('prophecies.receivedOn', { date: formatDate(one.receivedAt) })}`}
                        className="h-2 w-2 block rounded-full bg-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                      />
                    ))}
                    {cumplidas.map((one) => (
                      <Link
                        key={`c-${one.id}`}
                        to={`/prophecies/${one.id}`}
                        title={`${one.title} · ${t('prophecies.fulfilledOn', { date: formatDate(one.fulfilledAt ?? today) })}`}
                        aria-label={`${one.title}: ${t('prophecies.fulfilledOn', { date: formatDate(one.fulfilledAt ?? today) })}`}
                        className="h-2 w-2 block rotate-45 bg-success focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
