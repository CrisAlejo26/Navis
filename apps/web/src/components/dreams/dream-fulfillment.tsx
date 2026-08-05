import type { Dream } from '@navis/shared';
import { Pencil, Sunrise } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { formatDay } from '@/lib/format';

/**
 * Lo que significó, una vez ha pasado (RFC 0005 §7.6, D9).
 *
 * Es solo el panel: **el botón de marcarlo vive en la cabecera**, para que esté
 * a mano en las cuatro vistas. Aquí queda lo que se lee cuando ya se cumplió —la
 * fecha y la frase—, en el verde de siempre.
 *
 * Si el sueño sigue abierto esto no pinta nada: un bloque vacío diciendo «aún
 * no» ocuparía el sitio de lo que sí hay.
 */
export function DreamFulfillment({ dream, onEdit }: { dream: Dream; onEdit: () => void }) {
  const { t } = useTranslation();
  if (!dream.fulfilledAt) return null;

  return (
    <section
      style={{ animationDelay: '80ms' }}
      className="gap-3 p-4 sm:p-5 animate-rise-in flex flex-col rounded-xl border border-success/40 bg-success/10"
    >
      <h2 className="gap-2 text-sm font-medium flex items-center text-success">
        <Sunrise size={15} aria-hidden />
        {t('dreams.fulfilledOn', { date: formatDay(dream.fulfilledAt) })}
      </h2>

      {dream.fulfillmentMeaning ? (
        <p className="max-w-prose leading-relaxed text-[15px] whitespace-pre-wrap">
          {dream.fulfillmentMeaning}
        </p>
      ) : (
        <p className="text-sm text-muted-foreground">{t('dreams.meaningPlaceholder')}</p>
      )}

      <Button variant="ghost" size="md" className="self-start" onClick={onEdit}>
        <Pencil size={15} aria-hidden />
        {t('common.edit')}
      </Button>
    </section>
  );
}
