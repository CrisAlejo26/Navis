import { Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import type { PendingAudio } from '@/components/audio/audio-field';
import { AudioPlayer } from '@/components/audio/audio-player';
import { PendingAudioPlayer } from '@/components/audio/pending-audio-player';
import { Button } from '@/components/ui/button';
import { formatSeconds, type AudioPath, type SavedAudio } from '@/lib/audio/audio';

/**
 * Los audios mientras se edita algo: los que ya están en el servidor y los que
 * todavía no han subido.
 *
 * Los pendientes se distinguen con el borde discontinuo y lo dicen con
 * palabras —«Se subirá al guardar»—: que un audio esté ahí no significa lo
 * mismo antes y después de guardar, y eso no puede quedar en un matiz de estilo
 * (Regla 3 §7).
 */
export function AudioList({
  saved,
  pending,
  path,
  onRemovePending,
  onRemoveSaved,
}: {
  saved: readonly SavedAudio[];
  pending: readonly PendingAudio[];
  path: AudioPath;
  onRemovePending: (id: string) => void;
  onRemoveSaved: (id: string) => void;
}) {
  const { t } = useTranslation();
  if (saved.length === 0 && pending.length === 0) return null;

  return (
    <ul className="gap-2 flex flex-col">
      {saved.map((audio) => (
        <li key={audio.id} className="gap-2 flex items-center">
          <AudioPlayer audio={audio} path={path} className="flex-1" />
          <Quitar
            label={t('common.audio.remove')}
            onClick={() => {
              onRemoveSaved(audio.id);
            }}
          />
        </li>
      ))}

      {pending.map((audio) => (
        <li
          key={audio.id}
          className="gap-2 px-3 py-2 flex flex-col rounded-lg border border-dashed"
        >
          <span className="gap-2 flex items-center">
            <span className="min-w-0 flex-1">
              <span className="text-sm block truncate">
                {audio.recorded ? t('common.audio.recorded') : audio.filename}
                {audio.durationSeconds !== null && ` · ${formatSeconds(audio.durationSeconds)}`}
              </span>
              <span className="block text-[11px] text-muted-foreground">
                {t('common.audio.pending')}
              </span>
            </span>
            <Quitar
              label={t('common.audio.remove')}
              onClick={() => {
                onRemovePending(audio.id);
              }}
            />
          </span>

          {/* Se oye antes de subirlo: es la única forma de saber si la
              grabación de las cuatro de la mañana se entiende. */}
          <PendingAudioPlayer blob={audio.blob} />
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
