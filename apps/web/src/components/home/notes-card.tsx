import type { DashboardNote } from '@navis/shared';
import { NotebookText } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { TileHeader } from '@/components/home/tile-header';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { accentVars } from '@/lib/accents';
import { NOTE_STYLES } from '@/lib/believers/note-kinds';
import { cn } from '@/lib/cn';
import { formatDay } from '@/lib/format';
import { ACCENT_TONE } from '@/lib/stat-tones';

/**
 * Las últimas entradas de la bitácora, de cualquier persona (RFC 0001).
 *
 * Mismo tratamiento de cabecera y filo que `MetricCard`, con el acento
 * `success` —escribir crece con el tiempo, mismo verde que «cumplidas» en
 * Sueños y Profecías—. Cada fila lleva además el color de su tipo de nota
 * (`NOTE_STYLES`), igual que ya hace la bitácora de un creyente
 * (`notes-cards.tsx`): el color entra por el dato, no por decoración.
 */
export function NotesCard({ notes }: { notes: readonly DashboardNote[] }) {
  const { t } = useTranslation();

  return (
    <Card className={cn('p-0 gap-0 flex flex-col overflow-hidden', ACCENT_TONE.success.edge)}>
      <div className="p-5 pb-3">
        <TileHeader icon={NotebookText} label={t('home.recentNotes')} tone="success" />
      </div>

      {notes.length === 0 ? (
        <EmptyState icon={NotebookText} title={t('home.noRecentNotes')} />
      ) : (
        <ul className="divide-y">
          {notes.map((note) => {
            const style = NOTE_STYLES[note.kind];
            const Icon = style?.Icon ?? NotebookText;
            const accent = style?.accent ?? 'primary';

            return (
              <li
                key={note.id}
                style={accentVars(accent)}
                className="px-5 py-2.5 pl-4 border-l-[3px] border-l-[var(--acento)]"
              >
                <div className="gap-1.5 flex items-center">
                  <Icon size={13} aria-hidden className="shrink-0 text-[var(--acento)]" />
                  <p className="text-sm font-medium truncate">{note.believerName}</p>
                  <span className="text-xs ml-auto shrink-0 text-muted-foreground">
                    {formatDay(note.occurredAt, 'short')}
                  </span>
                </div>
                <p className="mt-0.5 text-xs line-clamp-1 text-muted-foreground">{note.excerpt}</p>
              </li>
            );
          })}
        </ul>
      )}

      <Link
        to="/believers"
        className="p-5 pt-3 text-xs font-medium mt-auto text-primary underline-offset-4 hover:underline"
      >
        {t('home.believersLink')}
      </Link>
    </Card>
  );
}
