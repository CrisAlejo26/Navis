import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router';

import { TileHeader, type TileTone } from '@/components/home/tile-header';
import { cn } from '@/lib/cn';
import { formatNumber } from '@/lib/format';
import { ACCENT_TONE, FILLED_TONE } from '@/lib/stat-tones';

/**
 * Un instrumento del panel de estado (RFC 0001, D-panel).
 *
 * Sin tarjeta propia a propósito: vive dentro de `StatusCard`, que junta los
 * dos —creyentes y atención— en **un solo cuadro con una línea en medio**, como
 * dos esferas del mismo instrumento y no dos fichas de SaaS repetidas una al
 * lado de la otra (Regla 9 §2).
 *
 * El `tone` es el color de esta mitad —`filled` para el ancla, un acento para
 * el resto—, el mismo sistema que ya usan las portadas de Sueños y Profecías
 * (`lib/stat-tones.ts`, RFC 0005 §7.1): no se inventa una paleta nueva.
 */
export function MetricCard({
  icon,
  label,
  value,
  sub,
  to,
  linkLabel,
  tone,
  children,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  /** Una segunda línea, como «8 altas este mes». */
  sub?: string;
  to: string;
  linkLabel: string;
  tone: TileTone;
  /** La vista previa de la tarjeta: nombres, filas… Va debajo del número. */
  children?: ReactNode;
}) {
  const filled = tone === 'filled';
  const colors = filled ? undefined : ACCENT_TONE[tone];

  return (
    <div className={cn('p-5 gap-3 flex flex-col', filled ? FILLED_TONE.card : colors?.edge)}>
      <TileHeader icon={icon} label={label} tone={tone} />

      <div>
        <p className={cn('text-3xl font-semibold tracking-[-0.02em] tabular-nums', colors?.value)}>
          {formatNumber(value)}
        </p>
        {sub && (
          <p className={cn('mt-0.5 text-xs', filled ? FILLED_TONE.label : 'text-muted-foreground')}>
            {sub}
          </p>
        )}
      </div>

      {children}

      <Link
        to={to}
        className={cn(
          'text-xs font-medium mt-auto underline-offset-4 hover:underline',
          filled ? FILLED_TONE.cta : 'text-primary',
        )}
      >
        {linkLabel}
      </Link>
    </div>
  );
}
