import { believerPhotoPath, isImageMimeType, MAX_IMAGE_BYTES } from '@navis/shared';
import { ImagePlus, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';

/** Lo que el formulario tiene que hacer al guardar: subir, quitar o nada. */
export type PhotoDraft = { kind: 'keep' } | { kind: 'remove' } | { kind: 'upload'; file: File };

/**
 * La fotografía en el formulario: subirla, cambiarla o quitarla.
 *
 * No sube al momento: deja **dicho qué hacer** y el formulario lo ejecuta al
 * guardar. Es lo que permite ponerle foto a alguien que todavía no existe —al
 * crear no hay identificador al que colgarla—, y es el mismo trato que reciben
 * los audios de una nota.
 *
 * La vista previa sale de una URL de objeto, que hay que **revocar**: cada una
 * retiene el fichero entero en memoria.
 */
export function PhotoField({
  believerId,
  hasPhoto,
  value,
  onChange,
}: {
  /** Solo al editar: es de donde se lee la que ya está guardada. */
  believerId?: string;
  hasPhoto: boolean;
  value: PhotoDraft;
  onChange: (draft: PhotoDraft) => void;
}) {
  const { t } = useTranslation();
  const [error, setError] = useState<string | null>(null);
  const picker = useRef<HTMLInputElement>(null);

  const preview = useMemo(
    () => (value.kind === 'upload' ? URL.createObjectURL(value.file) : null),
    [value],
  );

  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview);
    },
    [preview],
  );

  const saved =
    believerId && hasPhoto && value.kind === 'keep'
      ? `${api.baseUrl}${believerPhotoPath(believerId)}`
      : null;
  const shown = preview ?? saved;

  const attach = (file: File) => {
    if (!isImageMimeType(file.type)) {
      setError(t('believers.photoWrongType'));
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setError(t('believers.photoTooBig'));
      return;
    }

    setError(null);
    onChange({ kind: 'upload', file });
  };

  return (
    <fieldset className="gap-2 flex flex-col">
      <legend className="text-sm font-medium">{t('believers.photo')}</legend>

      <div className="gap-3 flex items-center">
        {shown ? (
          <img
            alt=""
            crossOrigin={preview ? undefined : 'use-credentials'}
            src={shown}
            className="size-16 shrink-0 rounded-full border object-cover"
          />
        ) : (
          <span
            aria-hidden
            className="size-16 flex shrink-0 items-center justify-center rounded-full border border-dashed text-muted-foreground"
          >
            <ImagePlus size={20} />
          </span>
        )}

        <div className="gap-2 flex flex-wrap">
          <Button
            variant="secondary"
            size="md"
            onClick={() => {
              picker.current?.click();
            }}
          >
            {shown ? t('believers.photoChange') : t('believers.photoAdd')}
          </Button>

          {shown && (
            <Button
              variant="ghost"
              size="md"
              className="hover:bg-destructive/10 hover:text-destructive"
              onClick={() => {
                setError(null);
                onChange({ kind: 'remove' });
              }}
            >
              <Trash2 size={15} aria-hidden />
              {t('believers.photoRemove')}
            </Button>
          )}
        </div>

        <input
          ref={picker}
          type="file"
          accept="image/*"
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

      <p className="text-xs text-muted-foreground">{error ?? t('believers.photoHint')}</p>
    </fieldset>
  );
}
