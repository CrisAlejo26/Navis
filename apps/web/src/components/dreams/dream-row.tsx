import type { DreamListItem } from '@navis/shared';
import { Mic } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { DreamActions } from '@/components/dreams/dream-actions';
import { EmotionChip } from '@/components/dreams/emotion-chip';
import { DreamStateBadge } from '@/components/dreams/state-badge';
import { TableCell } from '@/components/ui/table';
import { formatDay, formatWeekday } from '@/lib/format';

/** Lo mismo alimenta la fila de la tabla y la ficha de móvil (§7.5). */
export interface DreamCells {
  dream: DreamListItem;
  index: number;
  onEdit: () => void;
  onDelete: () => void;
}

/** Cuántas emociones caben en una fila antes de que la fila deje de leerse. */
const MAX_CHIPS = 3;

/** Un sueño como fila de la tabla, de `md` para arriba. */
export function DreamRow({ dream, onEdit, onDelete }: DreamCells) {
  const { t } = useTranslation();
  const day = new Date(`${dream.dreamedAt}T00:00:00Z`);

  return (
    <>
      {/* La noche primero y en grande: un sueño se busca por «aquella noche»,
          no por el título —que además puede no tener—. */}
      <TableCell className="w-px whitespace-nowrap">
        <span className="block text-[11px] text-muted-foreground uppercase">
          {formatWeekday(day.getUTCDay())}
        </span>
        {/* Con `short` salía «4/8/26», que en una columna de fechas se lee como
            un número de serie. El formato medio dice «4 ago 2026». */}
        <span className="text-sm font-medium block tabular-nums">{formatDay(dream.dreamedAt)}</span>
      </TableCell>

      <TableCell>
        <Link
          to={`/dreams/${dream.id}`}
          className="max-w-xs font-medium block truncate text-[15px] hover:underline"
        >
          {dream.title ?? t('dreams.untitled')}
        </Link>
        <span className="text-xs max-w-xs block truncate text-muted-foreground">
          {dream.excerpt}
        </span>
      </TableCell>

      {/* La columna de color del listado (D20). */}
      <TableCell className="lg:table-cell hidden">
        <span className="gap-1 flex flex-wrap">
          {dream.emotions.slice(0, MAX_CHIPS).map((emotion) => (
            <EmotionChip key={emotion.id} emotion={emotion} size="sm" />
          ))}
          {dream.emotions.length > MAX_CHIPS && (
            <span className="self-center text-[10px] text-muted-foreground">
              +{dream.emotions.length - MAX_CHIPS}
            </span>
          )}
        </span>
      </TableCell>

      <TableCell>
        <span className="gap-2 flex items-center">
          <DreamStateBadge state={dream.state} />
          {dream.audiosCount > 0 && (
            <Mic size={13} aria-label={t('common.audio.title')} className="text-muted-foreground" />
          )}
        </span>
      </TableCell>

      <TableCell className="text-right">
        <DreamActions title={dream.title ?? undefined} onEdit={onEdit} onDelete={onDelete} />
      </TableCell>
    </>
  );
}
