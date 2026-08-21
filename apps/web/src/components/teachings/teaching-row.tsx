import type { TeachingListItem } from '@navis/shared';
import { Link } from 'react-router';

import {
  TeachingActions,
  type TeachingActionHandlers,
} from '@/components/teachings/teaching-actions';
import { TeachingChecklistBadge } from '@/components/teachings/teaching-checklist-badge';
import { TableCell } from '@/components/ui/table';
import { formatDay } from '@/lib/format';

/** Lo mismo alimenta la fila de la tabla y la ficha de móvil. */
export interface TeachingCells extends TeachingActionHandlers {
  teaching: TeachingListItem;
  index: number;
}

/** Una enseñanza como fila de la tabla, de `md` para arriba. */
export function TeachingRow({ teaching, onEdit, onDelete }: TeachingCells) {
  return (
    <>
      <TableCell>
        <Link
          to={`/teachings/${teaching.id}`}
          className="max-w-xs font-medium block truncate text-[15px] hover:underline"
        >
          {teaching.title}
        </Link>
        <span className="text-xs max-w-xs block truncate text-muted-foreground">
          {teaching.excerpt}
        </span>
      </TableCell>

      <TableCell className="text-sm tabular-nums">{formatDay(teaching.receivedAt)}</TableCell>

      <TableCell>
        <TeachingChecklistBadge checklist={teaching.checklist} />
      </TableCell>

      <TableCell className="text-right">
        <TeachingActions title={teaching.title} onEdit={onEdit} onDelete={onDelete} />
      </TableCell>
    </>
  );
}
