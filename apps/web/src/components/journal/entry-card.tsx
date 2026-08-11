import { AudioLines } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import type { EntryCells } from '@/components/journal/entry-row';
import { EntryActions } from '@/components/journal/entry-actions';
import { EntryKindBadge } from '@/components/journal/entry-kind-badge';
import { ReminderIndicator } from '@/components/journal/reminder-indicator';
import { accentVars } from '@/lib/accents';
import { ENTRY_KIND_STYLES } from '@/lib/journal/entry-kind';
import { formatDay } from '@/lib/format';

/**
 * La misma entrada como ficha: la vista de serie, y donde más se nota el
 * color del tipo (D15, §7.5). El filete izquierdo de 3 px lleva el acento del
 * tipo — es la forma en que el color «tiñe» la tarjeta y no solo el icono.
 */
export function EntryCard({
  entry,
  index,
  onEdit,
  onDelete,
  selected,
  onToggleSelect,
}: EntryCells) {
  const { t } = useTranslation();
  const { accent } = ENTRY_KIND_STYLES[entry.kind];

  return (
    <article
      style={accentVars(accent)}
      className="pl-3 gap-2 flex flex-col border-l-[3px] border-l-[var(--acento)]"
    >
      <div className="gap-2 flex items-start justify-between">
        <EntryKindBadge kind={entry.kind} />
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggleSelect}
          aria-label={t('journal.selectOne', { title: entry.title })}
          className="h-4 w-4 rounded shrink-0 cursor-pointer accent-primary"
        />
      </div>

      <Link to={`/journal/${entry.id}`} className="min-w-0 font-medium text-[15px] hover:underline">
        {entry.title}
      </Link>

      <p className="line-clamp-3 text-[13px] text-muted-foreground">{entry.excerpt}</p>

      <div className="gap-x-3 gap-y-1 text-xs flex flex-wrap items-center text-muted-foreground tabular-nums">
        <span>{formatDay(entry.occurredAt)}</span>
        {entry.authorName && (
          <>
            <span aria-hidden>·</span>
            <span>{t('journal.authorLabel', { name: entry.authorName })}</span>
          </>
        )}
      </div>

      {(entry.remindAt ?? entry.hasAudio) && (
        <div className="gap-3 flex items-center">
          <ReminderIndicator
            remindAt={entry.remindAt}
            remindDoneAt={entry.remindDoneAt}
            index={index}
          />
          {entry.hasAudio && (
            <span className="gap-1 inline-flex items-center text-[11px] text-muted-foreground">
              <AudioLines size={13} aria-hidden />
              {t('journal.audiosField')}
            </span>
          )}
        </div>
      )}

      <EntryActions title={entry.title} onEdit={onEdit} onDelete={onDelete} />
    </article>
  );
}
