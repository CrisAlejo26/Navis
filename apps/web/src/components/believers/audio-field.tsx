import { isAudioMimeType, MAX_AUDIO_BYTES, type NoteAudio } from '@navis/shared';
import { Mic, Paperclip, Square } from 'lucide-react';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { AudioList } from '@/components/believers/audio-list';
import { Button } from '@/components/ui/button';
import { formatSeconds } from '@/lib/believers/audio';
import { useRecorder } from '@/lib/believers/use-recorder';

/** Un audio que todavía no ha subido: se sube al guardar la nota. */
export interface PendingAudio {
  id: string;
  blob: Blob;
  filename: string;
  recorded: boolean;
  durationSeconds: number | null;
}

interface AudioFieldProps {
  /** Los que ya están en el servidor. Solo aparecen al editar. */
  saved: readonly NoteAudio[];
  pending: readonly PendingAudio[];
  onAdd: (audio: PendingAudio) => void;
  onRemovePending: (id: string) => void;
  onRemoveSaved: (id: string) => void;
}

/**
 * **Los audios de una nota**: grabar aquí mismo o traer uno ya hecho.
 *
 * Lo grabado no se sube al momento: se queda en memoria y viaja **al guardar
 * la nota**, porque un audio necesita una nota a la que colgarse y la nota
 * todavía no existe. Al editar una que ya está, sube igual al guardar, para
 * que el botón signifique siempre lo mismo.
 */
export function AudioField({
  saved,
  pending,
  onAdd,
  onRemovePending,
  onRemoveSaved,
}: AudioFieldProps) {
  const { t } = useTranslation();
  const [error, setError] = useState<string | null>(null);
  const picker = useRef<HTMLInputElement>(null);

  const recorder = useRecorder((blob, seconds) => {
    onAdd({
      id: crypto.randomUUID(),
      blob,
      filename: `nota.${blob.type.includes('mp4') ? 'm4a' : 'webm'}`,
      recorded: true,
      durationSeconds: seconds,
    });
  });

  const attach = (file: File) => {
    if (!isAudioMimeType(file.type)) {
      setError(t('notes.audio.wrongType'));
      return;
    }
    if (file.size > MAX_AUDIO_BYTES) {
      setError(t('notes.audio.tooBig'));
      return;
    }

    setError(null);
    onAdd({
      id: crypto.randomUUID(),
      blob: file,
      filename: file.name,
      recorded: false,
      durationSeconds: null,
    });
  };

  const aviso =
    error ??
    (recorder.state === 'denied' ? t('notes.audio.denied') : null) ??
    (recorder.state === 'unsupported' ? t('notes.audio.unsupported') : null);

  return (
    <fieldset className="gap-2 flex flex-col">
      <legend className="text-sm font-medium">{t('notes.audio.title')}</legend>

      <div className="gap-2 flex flex-wrap">
        <Button
          variant={recorder.state === 'recording' ? 'destructive' : 'secondary'}
          size="md"
          onClick={() => {
            if (recorder.state === 'recording') recorder.stop();
            else void recorder.start();
          }}
        >
          {recorder.state === 'recording' ? (
            <>
              <Square size={15} aria-hidden />
              {t('notes.audio.stop')} · {formatSeconds(recorder.seconds)}
            </>
          ) : (
            <>
              <Mic size={15} aria-hidden />
              {t('notes.audio.record')}
            </>
          )}
        </Button>

        <Button
          variant="ghost"
          size="md"
          onClick={() => {
            picker.current?.click();
          }}
        >
          <Paperclip size={15} aria-hidden />
          {t('notes.audio.attach')}
        </Button>

        <input
          ref={picker}
          type="file"
          accept="audio/*"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) attach(file);
            // Se limpia para que elegir el mismo fichero dos veces vuelva a
            // disparar el `change`.
            event.target.value = '';
          }}
        />
      </div>

      {/* El punto rojo acompaña; lo que informa es el texto y el cronómetro. */}
      {recorder.state === 'recording' && (
        <p className="gap-2 text-xs flex items-center text-destructive">
          <span aria-hidden className="h-2 w-2 animate-latido rounded-full bg-destructive" />
          {t('notes.audio.recording')}
        </p>
      )}

      {aviso && <p className="text-xs text-warning">{aviso}</p>}

      <AudioList
        saved={saved}
        pending={pending}
        onRemovePending={onRemovePending}
        onRemoveSaved={onRemoveSaved}
      />
    </fieldset>
  );
}
