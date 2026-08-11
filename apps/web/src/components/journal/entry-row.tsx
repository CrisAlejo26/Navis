import type { JournalEntryListItem } from '@navis/shared';
import { AudioLines } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { EntryActions } from '@/components/journal/entry-actions';
import { EntryKindBadge } from '@/components/journal/entry-kind-badge';
import { ReminderIndicator } from '@/components/journal/reminder-indicator';
import { TableCell } from '@/components/ui/table';
import { formatDay } from '@/lib/format';

/** Lo mismo alimenta la fila de la tabla y la ficha de móvil (§7.5). */
export interface EntryCells {
  entry: JournalEntryListItem;
  index: number;
  onEdit: () => void;
  onDelete: () => void;
  /** La casilla de selección para exportar en lote (D12). */
  selected: boolean;
  onToggleSelect: () => void;
}

/** Una entrada como fila de la tabla, de `md` para arriba (§7.5). */
export function EntryRow({ entry, index, onEdit, onDelete, selected, onToggleSelect }: EntryCells) {
  const { t } = useTranslation();

  return (
    <>
      <TableCell className="w-10">
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggleSelect}
          aria-label={t('journal.selectOne', { title: entry.title })}
          className="h-4 w-4 rounded cursor-pointer accent-primary"
        />
      </TableCell>

      <TableCell>
        <Link
          to={`/journal/${entry.id}`}
          className="max-w-xs font-medium block truncate text-[15px] hover:underline"
        >
          {entry.title}
        </Link>
        <span className="gap-2 text-xs max-w-xs flex items-center text-muted-foreground">
          <span className="truncate">{entry.excerpt}</span>
          {entry.hasAudio && (
            <AudioLines size={12} aria-label={t('journal.audiosField')} className="shrink-0" />
          )}
        </span>
      </TableCell>

      <TableCell>
        <EntryKindBadge kind={entry.kind} />
      </TableCell>

      <TableCell className="text-sm tabular-nums">{formatDay(entry.occurredAt)}</TableCell>

      <TableCell className="text-sm">
        <ReminderIndicator
          remindAt={entry.remindAt}
          remindDoneAt={entry.remindDoneAt}
          index={index}
        />
      </TableCell>

      <TableCell className="lg:table-cell text-sm hidden text-muted-foreground">
        {entry.authorName ?? t('journal.unknownAuthor')}
      </TableCell>

      <TableCell className="text-right">
        <EntryActions title={entry.title} onEdit={onEdit} onDelete={onDelete} />
      </TableCell>
    </>
  );
}
