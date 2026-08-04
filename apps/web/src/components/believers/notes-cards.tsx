import type { BelieverNote, IsoDate } from '@navis/shared';
import { Mic, Pencil } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import type { NoteHandlers } from '@/components/believers/note-entry';
import { NoteReminder } from '@/components/believers/note-reminder';
import { Button } from '@/components/ui/button';
import { accentVars } from '@/lib/accents';
import { NOTE_STYLES } from '@/lib/believers/note-kinds';
import { formatDate } from '@/lib/format';

/**
 * La bitácora como **fichas**: cada nota en su tarjeta, en rejilla.
 *
 * Sirve para leer varias en paralelo —tres testimonios seguidos, por ejemplo—
 * y es la que mejor cae en un teléfono, donde una tabla no cabe y la bitácora
 * en columna se hace larga. El cuerpo se recorta a unas líneas: quien quiere el
 * detalle abre la nota.
 */
export function NotesCards({
  notes,
  today,
  canManage,
  onEdit,
  onToggleDone,
}: Pick<NoteHandlers, 'canManage'> & {
  notes: readonly BelieverNote[];
  today: IsoDate;
  onEdit: (note: BelieverNote) => void;
  onToggleDone: (note: BelieverNote) => void;
}) {
  const { t } = useTranslation();

  return (
    <ul className="gap-3 sm:grid-cols-2 xl:grid-cols-3 grid">
      {notes.map((note, index) => {
        const { Icon, accent, labelKey } = NOTE_STYLES[note.kind];

        return (
          <li
            key={note.id}
            style={{
              ...accentVars(accent),
              animationDelay: `${String(Math.min(index, 12) * 40)}ms`,
            }}
            className="animate-page-in"
          >
            <article className="gap-2 p-4 flex h-full flex-col rounded-xl border border-l-2 border-l-[var(--acento)] bg-card">
              <p className="gap-2 flex flex-wrap items-center">
                <span className="gap-1.5 font-semibold inline-flex items-center text-[11px] tracking-[0.1em] text-[var(--acento)] uppercase">
                  <Icon size={12} aria-hidden />
                  {t(labelKey)}
                </span>
                <span className="text-[11px] text-muted-foreground tabular-nums">
                  {formatDate(note.occurredAt, 'short')}
                </span>
                {note.audios.length > 0 && (
                  <Mic
                    size={12}
                    aria-label={t('notes.audio.title')}
                    className="text-muted-foreground"
                  />
                )}
              </p>

              <p className="text-sm leading-relaxed line-clamp-4 whitespace-pre-line">
                {note.told}
              </p>

              {note.advice && (
                <p className="pl-2.5 text-xs leading-relaxed line-clamp-2 border-l-2 border-border text-muted-foreground">
                  {note.advice}
                </p>
              )}

              <NoteReminder
                note={note}
                canManage={canManage}
                onToggleDone={() => {
                  onToggleDone(note);
                }}
              />

              {canManage && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="-ml-2 mt-auto self-start"
                  onClick={() => {
                    onEdit(note);
                  }}
                >
                  <Pencil size={13} aria-hidden />
                  {t('common.edit')}
                </Button>
              )}
            </article>
          </li>
        );
      })}
    </ul>
  );
}
