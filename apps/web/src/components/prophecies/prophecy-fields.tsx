import { toIsoDate, type Prophecy } from '@navis/shared';
import type { RefObject } from 'react';
import { useTranslation } from 'react-i18next';

import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

/**
 * Lo que se pide de una profecía (RFC 0004 §7.7): título, cuándo se recibió y
 * **el texto entero**.
 *
 * El área de texto es grande de verdad —doce filas y redimensionable—, con
 * `max-w-prose` para que la línea no cruce un monitor entero: es el campo
 * principal de esta pantalla y no puede ser una caja de tres líneas.
 */
export function ProphecyFields({
  prophecy,
  titleRef,
}: {
  prophecy?: Prophecy;
  titleRef: RefObject<HTMLInputElement | null>;
}) {
  const { t } = useTranslation();

  return (
    <>
      <Input
        ref={titleRef}
        name="title"
        label={t('prophecies.titleField')}
        placeholder={t('prophecies.titlePlaceholder')}
        defaultValue={prophecy?.title}
      />

      {/* La fecha no necesita todo el ancho del diálogo: un campo de día
          estirado a 42 rem se lee como un fallo de maquetación. */}
      <div className="sm:max-w-56">
        <Input
          name="receivedAt"
          type="date"
          label={t('prophecies.receivedAt')}
          defaultValue={prophecy?.receivedAt ?? toIsoDate(new Date())}
        />
      </div>

      {/* Sin `max-w-prose`: aquí se **escribe**, y un campo más estrecho que su
          diálogo se lee como un error. El ancho de lectura es cosa de la ficha,
          que es donde el texto se relee. */}
      <Textarea
        name="body"
        rows={12}
        label={t('prophecies.bodyField')}
        placeholder={t('prophecies.bodyPlaceholder')}
        defaultValue={prophecy?.body}
      />
    </>
  );
}
