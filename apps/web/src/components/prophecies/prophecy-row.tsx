import type { ProphecyListItem } from '@navis/shared';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { ProphecyActions } from '@/components/prophecies/prophecy-actions';
import { StateBadge } from '@/components/prophecies/state-badge';
import { TableCell } from '@/components/ui/table';
import { formatDate, formatNumber } from '@/lib/format';

/** Lo mismo alimenta la fila de la tabla y la ficha de móvil (§7.5). */
export interface ProphecyCells {
  prophecy: ProphecyListItem;
  index: number;
  onEdit: () => void;
  onFulfill: () => void;
  onDelete: () => void;
}

/** Una profecía como fila de la tabla, de `md` para arriba. */
export function ProphecyRow({ prophecy, onEdit, onFulfill, onDelete }: ProphecyCells) {
  const { t } = useTranslation();

  return (
    <>
      <TableCell>
        <Link
          to={`/prophecies/${prophecy.id}`}
          className="max-w-xs font-medium block truncate text-[15px] hover:underline"
        >
          {prophecy.title}
        </Link>
        <span className="text-xs max-w-xs block truncate text-muted-foreground">
          {prophecy.excerpt}
        </span>
      </TableCell>

      <TableCell className="text-sm tabular-nums">{formatDate(prophecy.receivedAt)}</TableCell>

      <TableCell>
        <StateBadge state={prophecy.state} />
      </TableCell>

      <TableCell className="lg:table-cell text-sm hidden text-muted-foreground tabular-nums">
        {prophecy.fulfillmentsCount > 0 ? formatNumber(prophecy.fulfillmentsCount) : '—'}
      </TableCell>

      <TableCell className="text-sm text-muted-foreground tabular-nums">
        {prophecy.fulfilledAt
          ? t('prophecies.waitedFor', { days: formatNumber(prophecy.waitingDays) })
          : t('prophecies.waitingFor', { days: formatNumber(prophecy.waitingDays) })}
      </TableCell>

      <TableCell className="text-right">
        <ProphecyActions onEdit={onEdit} onFulfill={onFulfill} onDelete={onDelete} />
      </TableCell>
    </>
  );
}
