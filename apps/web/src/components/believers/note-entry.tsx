import { daysBetween, type BelieverNote, type IsoDate } from '@navis/shared';
import { Pencil, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { NoteAudioPlayer } from '@/components/believers/note-audio-player';
import { NoteReminder } from '@/components/believers/note-reminder';
import { Button } from '@/components/ui/button';
import { accentVars } from '@/lib/accents';
import { NOTE_STYLES } from '@/lib/believers/note-kinds';
import { formatAgo, formatDate } from '@/lib/format';

export interface NoteHandlers {
  canManage: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onToggleDone: () => void;
}

/**
 * Una entrada de la bitácora (§7.5).
 *
 * Filete vertical del color del tipo, el tipo en versalitas con `tracking`
 * abierto, la fecha al lado, y el cuerpo en **dos bloques**: lo que contó y,
 * sangrada, la indicación que se le dio (D15). Leerlas separadas es lo que
 * permite repasar solo una de las dos columnas.
 *
 * El color del filete no informa solo: al lado va el tipo escrito y su icono.
 */
export function NoteEntry({
  note,
  today,
  canManage,
  onEdit,
  onDelete,
  onToggleDone,
}: NoteHandlers & { note: BelieverNote; today: IsoDate }) {
  const { t } = useTranslation();
  const { Icon, accent, labelKey } = NOTE_STYLES[note.kind];

  return (
    <article
      style={accentVars(accent)}
      className="gap-3 py-3 pl-4 group relative flex border-l-2 border-l-[var(--acento)]"
    >
      <div className="min-w-0 flex-1">
        <p className="gap-2 flex flex-wrap items-center">
          <span className="gap-1.5 font-semibold inline-flex items-center text-[11px] tracking-[0.1em] text-[var(--acento)] uppercase">
            <Icon size={12} aria-hidden />
            {t(labelKey)}
          </span>
          <span aria-hidden className="text-[11px] text-muted-foreground">
            ·
          </span>
          <span className="text-[11px] text-muted-foreground tabular-nums">
            {formatDate(note.occurredAt, 'short')}
          </span>
          {note.giftName && (
            <span className="px-2 py-0.5 rounded-full bg-muted text-[11px] text-muted-foreground">
              {note.giftName}
            </span>
          )}
        </p>

        <p className="mt-1 text-sm leading-relaxed whitespace-pre-line">{note.told}</p>

        {note.advice && (
          <p className="mt-2 pl-3 text-sm leading-relaxed border-l-2 border-border whitespace-pre-line text-muted-foreground">
            <span className="font-medium text-foreground/70">{t('notes.advice')}: </span>
            {note.advice}
          </p>
        )}

        <NoteReminder note={note} canManage={canManage} onToggleDone={onToggleDone} />

        {note.audios.length > 0 && (
          <ul className="gap-1.5 mt-2 flex flex-col">
            {note.audios.map((audio) => (
              <li key={audio.id}>
                <NoteAudioPlayer audio={audio} />
              </li>
            ))}
          </ul>
        )}

        <p className="mt-2 text-[11px] text-muted-foreground">
          {t('notes.byAuthor', {
            author: note.authorName ?? t('notes.unknownAuthor'),
            when: formatAgo(Math.max(0, daysBetween(note.createdAt.slice(0, 10), today))),
          })}
        </p>
      </div>

      {canManage && (
        <span className="gap-0.5 flex shrink-0 opacity-0 transition-opacity duration-200 group-focus-within:opacity-100 group-hover:opacity-100">
          <Button variant="ghost" size="icon" aria-label={t('notes.edit')} onClick={onEdit}>
            <Pencil size={14} aria-hidden />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label={t('notes.deleteTitle')}
            className="hover:bg-destructive/10 hover:text-destructive"
            onClick={onDelete}
          >
            <Trash2 size={14} aria-hidden />
          </Button>
        </span>
      )}
    </article>
  );
}
