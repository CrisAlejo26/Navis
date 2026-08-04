import type { AlertState, IsoDate } from '@navis/shared';
import { TriangleAlert } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/cn';
import { sound, type SondaTone } from '@/lib/believers/sonda';

/** Cada tono, con su relleno y el color de su texto. Van juntos a propósito. */
const TONES: Record<SondaTone, { fill: string; text: string }> = {
  ok: { fill: 'bg-primary', text: 'text-muted-foreground' },
  near: { fill: 'bg-warning', text: 'text-warning' },
  overdue: { fill: 'bg-destructive', text: 'text-destructive' },
  never: { fill: 'bg-warning', text: 'text-warning' },
  off: { fill: '', text: 'text-muted-foreground' },
};

interface SondaProps {
  believer: AlertState;
  today: IsoDate;
  /** `block` ocupa todo el ancho: es como se lee en una ficha. */
  variant?: 'inline' | 'block';
  /** Posición de la fila: escalona el latido de quien ha agotado su margen. */
  index?: number;
}

/**
 * **La sonda**: cuánto margen queda con esa persona (RFC 0003 §7.3).
 *
 * En una nave, la sonda mide cuánta agua queda bajo la quilla. Aquí mide
 * cuántos días quedan antes de que haga falta escribir algo de alguien: una
 * pista fina que se va llenando y que se desborda cuando se agota.
 *
 * Es un dato, no un adorno, y es el único elemento de color de la pantalla.
 * Por eso aquí no hay avatares: un círculo con iniciales competiría justo con
 * lo que sí significa algo.
 *
 * Accesibilidad: la pista va `aria-hidden` —es la representación, no el dato— y
 * lo que lee un lector de pantalla es la frase completa. Y el color nunca
 * informa solo: desbordada, el texto cambia y se le antepone un icono.
 */
export function Sonda({ believer, today, variant = 'inline', index = 0 }: SondaProps) {
  const { t } = useTranslation();
  const { tone, days, fill, margin } = sound(believer, today);
  const style = TONES[tone];

  // Sin ninguna nota se dice, aunque el aviso esté apagado: «hace 0 d» ahí se
  // leería como «se escribió hoy», que es justo lo contrario de lo que pasa.
  const never = believer.lastNoteAt === null;
  const label = never
    ? t('believers.alert.never')
    : t('believers.alert.since', { days: String(days) });

  const reader = never
    ? // Sin margen tampoco hay nada más que decir que «sin notas».
      margin === null
      ? t('believers.alert.never')
      : t('believers.alert.readerNever', { margin: String(margin) })
    : margin === null
      ? t('believers.alert.readerOff', { days: String(days) })
      : t('believers.alert.reader', { days: String(days), margin: String(margin) });

  return (
    <span className={cn('gap-2.5 flex items-center', variant === 'block' && 'w-full')}>
      {fill !== null && (
        <span
          aria-hidden
          className={cn(
            'relative h-[3px] overflow-hidden rounded-full bg-muted',
            variant === 'block' ? 'flex-1' : 'w-18 shrink-0',
          )}
        >
          {/* Tres capas, y cada una con **una** animación: un elemento no
              admite dos `animation-delay` distintos ni dos `animation` sin que
              la última pise a la anterior.

              1. el valor, que se transiciona al cambiar: al guardar una nota
                 la sonda se vacía sola, y esa es la tesis de la pantalla en un
                 gesto —escribir de alguien es volver a tener margen— (§7.8); */}
          <span
            data-sonda="fill"
            className="inset-0 ease-out absolute origin-left transition-transform duration-[420ms]"
            style={{ transform: `scaleX(${String(fill)})` }}
          >
            {/* 2. la entrada, que la llena de cero a su valor al aparecer; */}
            <span className="animate-sonda block h-full w-full origin-left">
              {/* 3. el color y, si se ha desbordado, el latido escalonado. */}
              <span
                className={cn(
                  'block h-full w-full rounded-full',
                  style.fill,
                  tone === 'overdue' && 'animate-latido',
                )}
                style={{ animationDelay: `${String(Math.min(index, 12) * 120)}ms` }}
              />
            </span>
          </span>
        </span>
      )}

      <span
        className={cn(
          'gap-1 inline-flex shrink-0 items-center text-[11px] tabular-nums',
          style.text,
          variant === 'block' && 'ml-auto',
        )}
      >
        {tone === 'overdue' && <TriangleAlert size={12} aria-hidden />}
        {label}
      </span>

      <span className="sr-only">{reader}</span>
    </span>
  );
}
