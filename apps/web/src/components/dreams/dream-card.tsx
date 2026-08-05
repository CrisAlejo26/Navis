import { Mic } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { DreamActions } from '@/components/dreams/dream-actions';
import { EmotionChip } from '@/components/dreams/emotion-chip';
import type { DreamCells } from '@/components/dreams/dream-row';
import { DreamStateBadge } from '@/components/dreams/state-badge';
import { accentVars } from '@/lib/accents';
import { formatDay } from '@/lib/format';

/**
 * El mismo sueño como ficha: es lo que se ve por debajo de `md` (§7.5).
 *
 * Lleva un **filo de color a la izquierda** con el de su primera emoción, que
 * es lo que hace que una lista en un teléfono no sea una columna gris. Cuando
 * no hay ninguna, no hay filo: el color entra por el dato o no entra (§7.1.1).
 */
export function DreamCard({ dream, onEdit, onDelete }: DreamCells) {
  const { t } = useTranslation();
  const first = dream.emotions[0];

  return (
    <article
      style={first ? accentVars(first.accent) : undefined}
      className={
        first
          ? 'gap-2 pl-3 flex flex-col border-l-[3px] border-l-[var(--acento)]'
          : 'gap-2 flex flex-col'
      }
    >
      <div className="gap-2 flex items-start justify-between">
        <Link
          to={`/dreams/${dream.id}`}
          className="min-w-0 font-medium text-[15px] hover:underline"
        >
          {dream.title ?? t('dreams.untitled')}
        </Link>
        <DreamStateBadge state={dream.state} className="shrink-0" />
      </div>

      <p className="line-clamp-3 text-[13px] text-muted-foreground">{dream.excerpt}</p>

      {dream.emotions.length > 0 && (
        <div className="gap-1 flex flex-wrap">
          {dream.emotions.map((emotion) => (
            <EmotionChip key={emotion.id} emotion={emotion} size="sm" />
          ))}
        </div>
      )}

      <div className="gap-x-3 gap-y-1 text-xs flex flex-wrap items-center text-muted-foreground tabular-nums">
        <span>{t('dreams.dreamedOn', { date: formatDay(dream.dreamedAt) })}</span>
        {dream.audiosCount > 0 && (
          <>
            <span aria-hidden>·</span>
            <span className="gap-1 inline-flex items-center">
              <Mic size={12} aria-hidden />
              {t('common.audio.count', { total: dream.audiosCount })}
            </span>
          </>
        )}
      </div>

      <DreamActions title={dream.title ?? undefined} onEdit={onEdit} onDelete={onDelete} />
    </article>
  );
}
