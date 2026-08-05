import { ArrowRight } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router';

import { cn } from '@/lib/cn';

/** Hasta dónde se escalona la entrada: más allá, la cascada solo hace esperar. */
const STAGGERED = 6;

/**
 * Una tarjeta de la portada (RFC 0004 D10).
 *
 * Se gana el sitio cumpliendo dos condiciones, y sin ellas no iría: **lleva a
 * algún lado** —abre el listado ya filtrado, con el filtro en la URL— y
 * **enseña forma** además del número, en el hueco de `children`. Un número
 * grande que no se puede pulsar y no dice cómo ha llegado ahí es mobiliario
 * (Regla 9 §2).
 *
 * El degradado va **entre dos tokens** y nunca como fondo de pantalla: separa
 * la tarjeta del lienzo y para de contar.
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
  children,
}: {
  to: string;
  label: string;
  value: ReactNode;
  hint?: string;
  /** Llamada explícita al pie, con su flecha. Para la tarjeta que abre el listado. */
  cta?: string;
  /** Clases del degradado, siempre entre dos tokens. */
  gradient?: string;
  wide?: boolean;
  /** Posición en la rejilla: escalona la entrada (§7.8). */
  index?: number;
  children?: ReactNode;
}) {
  return (
    <Link
      to={to}
      style={{ animationDelay: `${String(Math.min(index, STAGGERED) * 60)}ms` }}
      className={cn(
        'gap-3 p-4 group animate-rise-in flex flex-col rounded-xl border bg-card',
        'transition-[border-color,box-shadow] duration-200',
        'hover:shadow-sm hover:border-foreground/25',
        'focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
        gradient,
        wide && 'sm:col-span-2',
      )}
    >
      <span className="text-xs font-medium text-muted-foreground">{label}</span>

      <span className="text-3xl font-semibold leading-none tracking-[-0.02em] tabular-nums">
        {value}
      </span>

      {children}

      {hint && <span className="text-xs text-muted-foreground">{hint}</span>}

      {cta && (
        <span className="gap-1 pt-1 text-xs font-medium mt-auto inline-flex items-center text-primary">
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
