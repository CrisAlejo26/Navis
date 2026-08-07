import {
  useCreateDream,
  useDeleteDreamAudio,
  useUpdateDream,
  useUploadDreamAudio,
} from '@navis/api-client';
import { createDreamSchema, dreamAudioPath, type Dream } from '@navis/shared';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';

import { AudioField, type PendingAudio } from '@/components/audio/audio-field';
import { FormError } from '@/components/auth/form-error';
import { DreamFields } from '@/components/dreams/dream-fields';
import { EmotionPicker } from '@/components/dreams/emotion-picker';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { formText, optionalText } from '@/lib/form';
import { toast } from '@/lib/toast';

/**
 * Los campos y el envío, ya con el sueño cargado (si se está editando).
 *
 * Está separado de `DreamForm` para que su estado **nazca correcto**: lo monta
 * el padre con `key` cuando llegan los datos, así que las emociones elegidas se
 * inicializan de una vez y no hay que sincronizarlas con un efecto —que además
 * pisaría lo que se esté escribiendo en cada `refetch`—.
 */
export function DreamFormBody({ dream, onSaved }: { dream?: Dream; onSaved: () => void }) {
  const { t } = useTranslation();
  const create = useCreateDream(api);
  const update = useUpdateDream(api);
  const upload = useUploadDreamAudio(api);
  const removeAudio = useDeleteDreamAudio(api);

  const [emotionIds, setEmotionIds] = useState<string[]>(
    (dream?.emotions ?? []).map((emotion) => emotion.id),
  );
  const [pending, setPending] = useState<PendingAudio[]>([]);
  const [error, setError] = useState<string | null>(null);

  // El sueño se lleva el foco al montar: es a lo que se viene. Con `ref` y no
  // con `autoFocus`, que dentro de un `<dialog>` modal no vale.
  const body = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    body.current?.focus();
  }, []);

  /** Los audios suben **después**: antes no hay sueño del que colgarlos. */
  const subirAudios = async (dreamId: string) => {
    for (const audio of pending) {
      await upload.mutateAsync({
        dreamId,
        file: audio.blob,
        filename: audio.filename,
        recorded: audio.recorded,
        durationSeconds: audio.durationSeconds,
      });
    }
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

    const parsed = createDreamSchema.safeParse({
      title: optionalText(form.get('title')),
      body: formText(form.get('body')),
      dreamedAt: formText(form.get('dreamedAt')),
      interpretation: optionalText(form.get('interpretation')),
      emotionIds,
    });

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? t('dreams.errorEmpty'));
      return;
    }

    setError(null);
    const guardar = dream
      ? update.mutateAsync({ id: dream.id, ...parsed.data })
      : create.mutateAsync(parsed.data);

    void guardar
      .then(async (saved) => {
        await subirAudios(saved.id);
        toast.success(dream ? t('dreams.updated') : t('dreams.created'));
        onSaved();
      })
      .catch(() => {
        setError(t('errors.generic'));
      });
  };

  return (
    <form onSubmit={submit} className="gap-4 min-w-0 flex flex-col" noValidate>
      <DreamFields dream={dream} bodyRef={body} />
      <EmotionPicker value={emotionIds} onChange={setEmotionIds} />

      <AudioField
        saved={dream?.audios ?? []}
        pending={pending}
        path={dreamAudioPath}
        filename="sueno"
        onAdd={(audio) => {
          setPending((previous) => [...previous, audio]);
        }}
        onRemovePending={(id) => {
          setPending((previous) => previous.filter((one) => one.id !== id));
        }}
        onRemoveSaved={(id) => {
          void removeAudio.mutateAsync(id);
        }}
      />

      <FormError message={error} />

      <Button
        type="submit"
        size="lg"
        className="w-full"
        isLoading={create.isPending || update.isPending || upload.isPending}
      >
        {t('common.save')}
      </Button>
    </form>
  );
}
