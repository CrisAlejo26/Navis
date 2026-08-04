import { isReminderDue, type BelieverNote } from '@navis/shared';
import { BellRing, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/cn';
import { formatDateTime } from '@/lib/format';

/**
 * El recordatorio de una nota, tal y como se ve en la bitácora (D16).
 *
 * Tres estados y los tres con palabras además del color: pendiente, vencido
 * —que es el que llama— y hecho. Vencido lleva icono y borde, no solo el tono
 * `warning`, porque el color no informa solo (Regla 3 §7).
 *
 * Notificar fuera de la pantalla es la RFC 0006: aquí el aviso vive donde vive
 * el resto de esta sección, que es a la vista.
 */
export function NoteReminder({
  note,
  canManage,
  onToggleDone,
}: {
  note: BelieverNote;
  canManage: boolean;
  onToggleDone: () => void;
}) {
  const { t } = useTranslation();
  if (!note.remindAt) return null;

  const due = isReminderDue(note);
  const done = note.remindDoneAt !== null;
  const when = formatDateTime(note.remindAt);

  return (
    <p
      className={cn(
        'gap-2 mt-2 px-2.5 py-1.5 flex flex-wrap items-center rounded-lg text-[11px]',
        done && 'bg-muted text-muted-foreground line-through',
        !done && due && 'border border-warning/40 bg-warning/10 text-warning',
        !done && !due && 'bg-muted text-muted-foreground',
      )}
    >
      {done ? <Check size={12} aria-hidden /> : <BellRing size={12} aria-hidden />}

      <span>
        {done
          ? t('notes.reminder.done')
          : due
            ? t('notes.reminder.overdue', { when })
            : t('notes.reminder.pending', { when })}
        {note.remindText && ` · ${note.remindText}`}
      </span>

      {canManage && (
        <button
          type="button"
          onClick={onToggleDone}
          className="ml-auto rounded-sm underline-offset-2 hover:underline"
        >
          {done ? t('notes.reminder.markPending') : t('notes.reminder.markDone')}
        </button>
      )}
    </p>
  );
}
