import type { Dream } from '@navis/shared';

import { cn } from '@/lib/cn';

/**
 * El sueño, tal y como se escribió.
 *
 * `max-w-prose` va en el **texto** y no en la tarjeta: la tarjeta llena su
 * columna, pero una línea que cruza un monitor entero no se lee (Regla 5 §3).
 *
 * En la vista de lectura sube a 17 px con más interlínea, que es la misma
 * diferencia que hace la ficha de una profecía: leer de corrido no es lo mismo
 * que echar un vistazo.
 */
export function DreamBody({
  dream,
  size = 'normal',
}: {
  dream: Dream;
  size?: 'normal' | 'lectura';
}) {
  return (
    <article
      style={{ animationDelay: '80ms' }}
      className="p-4 sm:p-6 animate-rise-in rounded-xl border bg-card"
    >
      <p
        className={cn(
          'max-w-prose whitespace-pre-wrap',
          size === 'lectura' ? 'text-[17px] leading-[1.75]' : 'leading-relaxed text-[15px]',
        )}
      >
        {dream.body}
      </p>
    </article>
  );
}
