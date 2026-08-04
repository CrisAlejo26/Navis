import type { ButtonHTMLAttributes, ReactNode } from 'react';

import { cn } from '@/lib/cn';

type Tone = 'neutral' | 'warning';

/**
 * Pastilla que se enciende y se apaga: un filtro, una opción de un grupo.
 *
 * No es un `Button` —no ejecuta una acción, marca un estado— y por eso lleva
 * `aria-pressed` y no un `variant` de los suyos. Vive en `ui` porque la usan
 * las sedes del calendario, los filtros y la hoja de compartir; tenerla tres
 * veces copiada era lo que había antes (Regla 1 §5).
 */
export function Chip({
  active,
  tone = 'neutral',
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  active: boolean;
  /** `warning` para lo que avisa de algo, como «solo lo que falta». */
  tone?: Tone;
  children?: ReactNode;
}) {
  const encendida =
    tone === 'warning'
      ? 'border-warning/40 bg-warning/15 text-warning'
      : 'border-foreground/25 bg-foreground/8 text-foreground';

  return (
    <button
      type="button"
      aria-pressed={active}
      className={cn(
        'h-8 gap-1.5 px-3 text-xs font-medium inline-flex cursor-pointer items-center rounded-full border',
        'transition-[background-color,border-color,color] duration-200',
        'focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
        active
          ? encendida
          : 'border-transparent bg-muted text-muted-foreground hover:text-foreground',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
