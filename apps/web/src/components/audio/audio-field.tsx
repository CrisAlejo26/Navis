import { isAudioMimeType, MAX_AUDIO_BYTES } from '@navis/shared';
import { Mic, Paperclip, Square } from 'lucide-react';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { AudioList } from '@/components/audio/audio-list';
import { Button } from '@/components/ui/button';
import { formatSeconds, type AudioPath, type SavedAudio } from '@/lib/audio/audio';
import { useRecorder } from '@/lib/audio/use-recorder';

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
  saved: readonly SavedAudio[];
  pending: readonly PendingAudio[];
  /** De dónde se descargan los ya subidos: cada dueño cuelga de su ruta. */
  path: AudioPath;
  /** Cómo se llama lo grabado aquí mismo. Solo viaja para el `multipart`. */
  filename?: string;
  onAdd: (audio: PendingAudio) => void;
  onRemovePending: (id: string) => void;
  onRemoveSaved: (id: string) => void;
}

/**
 * **Los audios**: grabar aquí mismo o traer uno ya hecho.
 *
 * Lo grabado no se sube al momento: se queda en memoria y viaja **al guardar**,
 * porque un audio necesita algo de lo que colgar y eso todavía no existe. Al
 * editar algo que ya está, sube igual al guardar, para que el botón signifique
 * siempre lo mismo.
 *
 * Lo comparten la bitácora de creyentes y los sueños (RFC 0005 D13): no son dos
 * cosas parecidas, es la misma, y duplicarla dejaría dos sitios donde arreglar
 * el día que la grabación falle.
 */
export function AudioField({
  saved,
  pending,
  path,
  filename = 'audio',
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
      filename: `${filename}.${blob.type.includes('mp4') ? 'm4a' : 'webm'}`,
      recorded: true,
      durationSeconds: seconds,
    });
  });

  const attach = (file: File) => {
    if (!isAudioMimeType(file.type)) {
      setError(t('common.audio.wrongType'));
      return;
    }
    if (file.size > MAX_AUDIO_BYTES) {
      setError(t('common.audio.tooBig'));
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
    (recorder.state === 'denied' ? t('common.audio.denied') : null) ??
    (recorder.state === 'unsupported' ? t('common.audio.unsupported') : null);

  return (
    <fieldset className="gap-2 flex flex-col">
      <legend className="text-sm font-medium">{t('common.audio.title')}</legend>

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
              {t('common.audio.stop')} · {formatSeconds(recorder.seconds)}
            </>
          ) : (
            <>
              <Mic size={15} aria-hidden />
              {t('common.audio.record')}
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
          {t('common.audio.attach')}
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
          {t('common.audio.recording')}
        </p>
      )}

      {aviso && <p className="text-xs text-warning">{aviso}</p>}

      <AudioList
        saved={saved}
        pending={pending}
        path={path}
        onRemovePending={onRemovePending}
        onRemoveSaved={onRemoveSaved}
      />
    </fieldset>
  );
}
