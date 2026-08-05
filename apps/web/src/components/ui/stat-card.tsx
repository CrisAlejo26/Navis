import { ArrowRight, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router';

import { cn } from '@/lib/cn';
import { ACCENT_TONE, FILLED_TONE, type StatAccent } from '@/lib/stat-tones';

/** Hasta dónde se escalona la entrada: más allá, la cascada solo hace esperar. */
const STAGGERED = 6;

/**
 * Una tarjeta de métrica de una portada (RFC 0004 D10, RFC 0005 §7.1).
 *
 * Se gana el sitio cumpliendo dos condiciones, y sin ellas no iría: **lleva a
 * algún lado** —abre el listado ya filtrado, con el filtro en la URL— y
 * **enseña forma** además del número, en el hueco de `children`. Un número
 * grande que no se puede pulsar y no dice cómo ha llegado ahí es mobiliario
 * (Regla 9 §2).
 *
 * Vive en `ui/` porque la comparten profecías y sueños. El `tone` decide cuánto
 * color lleva, y la regla está en `lib/stat-tones.ts`: **una rellena por
 * rejilla** y ninguna con tintes que no se vean.
 */
export function StatCard({
  to,
  label,
  value,
  hint,
  cta,
  gradient,
  wide,
  index = 0,
  tone = 'plain',
  accent = 'primary',
  Icon,
  children,
}: {
  to: string;
  label: string;
  value: ReactNode;
  hint?: string;
  /** Llamada explícita al pie, con su flecha. Para la tarjeta que abre el listado. */
  cta?: string;
  /** Clases del degradado, siempre entre dos tokens. Solo con `tone="plain"`. */
  gradient?: string;
  wide?: boolean;
  /** Posición en la rejilla: escalona la entrada (§7.8). */
  index?: number;
  tone?: 'plain' | 'accent' | 'filled';
  accent?: StatAccent;
  Icon?: LucideIcon;
  children?: ReactNode;
}) {
  const filled = tone === 'filled';
  const colors = ACCENT_TONE[accent];

  return (
    <Link
      to={to}
      style={{ animationDelay: `${String(Math.min(index, STAGGERED) * 60)}ms` }}
      className={cn(
        'gap-3 p-4 group animate-rise-in flex flex-col rounded-xl border bg-card',
        'transition-[border-color,box-shadow] duration-200',
        'hover:shadow-sm hover:border-foreground/25',
        'focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
        tone === 'plain' && gradient,
        tone === 'accent' && colors.edge,
        filled && FILLED_TONE.card,
        wide && 'sm:col-span-2',
      )}
    >
      <span className="gap-2 flex items-center">
        {Icon && (
          <span
            aria-hidden
            className={cn(
              'size-7 inline-flex items-center justify-center rounded-lg',
              filled ? FILLED_TONE.chip : colors.chip,
            )}
          >
            <Icon size={15} />
          </span>
        )}
        <span
          className={cn(
            'text-xs font-medium',
            filled ? FILLED_TONE.label : 'text-muted-foreground',
          )}
        >
          {label}
        </span>
      </span>

      <span
        className={cn(
          'text-3xl font-semibold leading-none tracking-[-0.02em] tabular-nums',
          tone === 'accent' && colors.value,
        )}
      >
        {value}
      </span>

      {children}

      {hint && (
        <span className={cn('text-xs', filled ? FILLED_TONE.label : 'text-muted-foreground')}>
          {hint}
        </span>
      )}

      {cta && (
        <span
          className={cn(
            'gap-1 pt-1 text-xs font-medium mt-auto inline-flex items-center',
            filled ? FILLED_TONE.cta : 'text-primary',
          )}
        >
          {cta}
          {/* La flecha avanza al pasar por encima: dice que esto lleva a algún
              sitio sin necesidad de escribirlo dos veces. */}
          <ArrowRight
            size={13}
            aria-hidden
            className="group-hover:translate-x-0.5 transition-transform duration-200"
          />
        </span>
      )}
    </Link>
  );
}
