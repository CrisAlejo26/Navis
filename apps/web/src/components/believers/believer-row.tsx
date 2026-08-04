import {
  believerName,
  type BelieverListItem,
  type Congregation,
  type IsoDate,
} from '@navis/shared';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import {
  BelieverActions,
  type BelieverActionHandlers,
} from '@/components/believers/believer-actions';
import { GiftTags } from '@/components/believers/gift-tags';
import { Sonda } from '@/components/believers/sonda';
import { StatusBadge } from '@/components/believers/status-badge';
import { TableCell } from '@/components/ui/table';
import { accentVars } from '@/lib/accents';
import { cn } from '@/lib/cn';

export interface BelieverCells extends BelieverActionHandlers {
  believer: BelieverListItem;
  congregation: Congregation | undefined;
  today: IsoDate;
  canManage: boolean;
  /** Posición en la página: escalona la entrada y el latido de la sonda. */
  index: number;
  /** Marcada para la acción en lote. Solo con `believers.manage`. */
  selected: boolean;
  onToggleSelected: () => void;
}

/**
 * Una fila de la tabla (§7.4).
 *
 * Sin avatar: no hay fotos, y un círculo con iniciales de color al azar compite
 * justo con los dos colores que aquí sí significan algo —el del don y el de la
 * sonda—. El nombre sostiene la fila él solo (§7.1).
 */
export function BelieverRow({
  believer,
  congregation,
  today,
  canManage,
  index,
  selected,
  onToggleSelected,
  ...actions
}: BelieverCells) {
  const { t } = useTranslation();
  const name = believerName(believer);

  return (
    <>
      {canManage && (
        <TableCell className="w-0 pr-0">
          <input
            type="checkbox"
            checked={selected}
            aria-label={t('believers.selectOne', { name })}
            onChange={onToggleSelected}
            className="h-4 w-4 rounded cursor-pointer accent-primary focus-visible:ring-2 focus-visible:ring-ring"
          />
        </TableCell>
      )}

      <TableCell>
        <Link
          to={`/believers/${believer.id}`}
          className="font-medium rounded-sm text-[15px] hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          {name}
        </Link>
        {believer.phone && (
          <span className="text-xs block text-muted-foreground tabular-nums">{believer.phone}</span>
        )}
      </TableCell>

      <TableCell>
        {congregation && (
          <span className="gap-2 text-xs inline-flex items-center text-muted-foreground">
            <span
              aria-hidden
              style={accentVars(congregation.accent)}
              className="h-1.5 w-1.5 rounded-full bg-[var(--acento)]"
            />
            {congregation.name}
          </span>
        )}
      </TableCell>

      <TableCell>
        <StatusBadge status={believer.status} />
      </TableCell>

      <TableCell className="lg:table-cell hidden">
        <GiftTags gifts={believer.gifts} max={3} />
      </TableCell>

      <TableCell>
        <Sonda believer={believer} today={today} index={index} />
      </TableCell>

      <TableCell className={cn('text-right', !canManage && 'w-0 p-0')}>
        <BelieverActions name={name} canManage={canManage} {...actions} />
      </TableCell>
    </>
  );
}
