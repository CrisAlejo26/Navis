import type { NoteAudio } from '@navis/shared';
import { Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import type { PendingAudio } from '@/components/believers/audio-field';
import { NoteAudioPlayer } from '@/components/believers/note-audio-player';
import { Button } from '@/components/ui/button';
import { formatSeconds } from '@/lib/believers/audio';

/**
 * Los audios de una nota mientras se edita: los que ya están en el servidor y
 * los que todavía no han subido.
 *
 * Los pendientes se distinguen con el borde discontinuo y lo dicen con
 * palabras —«Se subirá al guardar la nota»—: que un audio esté ahí no significa
 * lo mismo antes y después de guardar, y eso no puede quedar en un matiz de
 * estilo (Regla 3 §7).
 */
export function AudioList({
  saved,
  pending,
  onRemovePending,
  onRemoveSaved,
}: {
  saved: readonly NoteAudio[];
  pending: readonly PendingAudio[];
  onRemovePending: (id: string) => void;
  onRemoveSaved: (id: string) => void;
}) {
  const { t } = useTranslation();
  if (saved.length === 0 && pending.length === 0) return null;

  return (
    <ul className="gap-2 flex flex-col">
      {saved.map((audio) => (
        <li key={audio.id} className="gap-2 flex items-center">
          <NoteAudioPlayer audio={audio} className="flex-1" />
          <Quitar
            label={t('notes.audio.remove')}
            onClick={() => {
              onRemoveSaved(audio.id);
            }}
          />
        </li>
      ))}

      {pending.map((audio) => (
        <li
          key={audio.id}
          className="gap-2 px-3 py-2 flex items-center rounded-lg border border-dashed"
        >
          <span className="min-w-0 flex-1">
            <span className="text-sm block truncate">
              {audio.recorded ? t('notes.audio.recorded') : audio.filename}
              {audio.durationSeconds !== null && ` · ${formatSeconds(audio.durationSeconds)}`}
            </span>
            <span className="block text-[11px] text-muted-foreground">
              {t('notes.audio.pending')}
            </span>
          </span>
          <Quitar
            label={t('notes.audio.remove')}
            onClick={() => {
              onRemovePending(audio.id);
            }}
          />
        </li>
      ))}
    </ul>
  );
}

function Quitar({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={label}
      className="hover:bg-destructive/10 hover:text-destructive"
      onClick={onClick}
    >
      <Trash2 size={15} aria-hidden />
    </Button>
  );
}
