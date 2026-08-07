import type { Dream } from '@navis/shared';
import type { RefObject } from 'react';
import { useTranslation } from 'react-i18next';

import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { proposedNight } from '@/lib/dreams/night';

/**
 * Lo que se pide de un sueño al apuntarlo o editarlo (RFC 0005 §7.7): la
 * noche, un título si apetece, **el sueño entero** y, si ya se tiene, la
 * posible interpretación.
 *
 * El orden no es el de profecías: aquí manda el cuerpo, y se lleva el foco. El
 * título va después y es opcional, porque a las cuatro de la mañana nadie
 * titula (D17). La interpretación va al final y también opcional, por el
 * mismo motivo: la mayoría de las veces se deja en blanco aquí y se escribe
 * más tarde desde la ficha (`DreamInterpretation`), que sigue siendo el sitio
 * pensado para retocarla sin abrir este diálogo.
 */
export function DreamFields({
  dream,
  bodyRef,
}: {
  dream?: Dream;
  bodyRef: RefObject<HTMLTextAreaElement | null>;
}) {
  const { t } = useTranslation();

  return (
    <>
      {/* Sin `max-w-prose`: aquí se **escribe**, y un campo más estrecho que su
          diálogo se lee como un error. El ancho de lectura es cosa de la ficha. */}
      <Textarea
        ref={bodyRef}
        name="body"
        rows={10}
        label={t('dreams.bodyField')}
        placeholder={t('dreams.bodyPlaceholder')}
        defaultValue={dream?.body}
        required
      />

      <div className="gap-3 sm:flex-row flex flex-col">
        <div className="sm:max-w-56">
          <Input
            name="dreamedAt"
            type="date"
            label={t('dreams.dreamedAt')}
            defaultValue={dream?.dreamedAt ?? proposedNight()}
            required
          />
        </div>

        <div className="flex-1">
          <Input
            name="title"
            label={t('dreams.titleField')}
            placeholder={t('dreams.titlePlaceholder')}
            defaultValue={dream?.title ?? ''}
          />
        </div>
      </div>

      <Textarea
        name="interpretation"
        rows={3}
        label={t('dreams.interpretation')}
        placeholder={t('dreams.interpretationPlaceholder')}
        defaultValue={dream?.interpretation ?? ''}
        hint={t('dreams.interpretationHint')}
      />
    </>
  );
}
