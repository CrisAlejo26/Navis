import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { ProphecyActions } from '@/components/prophecies/prophecy-actions';
import type { ProphecyCells } from '@/components/prophecies/prophecy-row';
import { StateBadge } from '@/components/prophecies/state-badge';
import { formatDate, formatNumber } from '@/lib/format';

/**
 * La misma profecía como ficha: es lo que se ve por debajo de `md` y también en
 * la vista de fichas (§7.5).
 *
 * El extracto a tres líneas y no entero: para leer la palabra completa se abre
 * la ficha, que es donde tiene un ancho de lectura decente (Regla 5 §3).
 */
export function ProphecyCard({ prophecy, onEdit, onFulfill, onDelete }: ProphecyCells) {
  const { t } = useTranslation();

  return (
    <article className="gap-2 flex flex-col">
      <div className="gap-2 flex items-start justify-between">
        <Link
          to={`/prophecies/${prophecy.id}`}
          className="min-w-0 font-medium text-[15px] hover:underline"
        >
          {prophecy.title}
        </Link>
        <StateBadge state={prophecy.state} className="shrink-0" />
      </div>

      <p className="line-clamp-3 text-[13px] text-muted-foreground">{prophecy.excerpt}</p>

      <div className="gap-x-3 gap-y-1 text-xs flex flex-wrap items-center text-muted-foreground tabular-nums">
        <span>{t('prophecies.receivedOn', { date: formatDate(prophecy.receivedAt) })}</span>
        <span aria-hidden>·</span>
        <span>
          {prophecy.fulfilledAt
            ? t('prophecies.waitedFor', { days: formatNumber(prophecy.waitingDays) })
            : t('prophecies.waitingFor', { days: formatNumber(prophecy.waitingDays) })}
        </span>
        {prophecy.fulfillmentsCount > 0 && (
          <>
            <span aria-hidden>·</span>
            <span>
              {t('prophecies.fulfillmentsTotal', {
                total: formatNumber(prophecy.fulfillmentsCount),
              })}
            </span>
          </>
        )}
      </div>

      <ProphecyActions
        title={prophecy.title}
        onEdit={onEdit}
        onFulfill={onFulfill}
        onDelete={onDelete}
      />
    </article>
  );
}
