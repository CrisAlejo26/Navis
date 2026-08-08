import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router';

import { formatNumber } from '@/lib/format';

/**
 * Un instrumento del panel de estado (RFC 0001, D-panel).
 *
 * Sin tarjeta propia a propósito: vive dentro de `StatusCard`, que junta los
 * dos —creyentes y atención— en **un solo cuadro con una línea en medio**, como
 * dos esferas del mismo instrumento y no dos fichas de SaaS repetidas una al
 * lado de la otra (Regla 9 §2).
 */
export function MetricCard({
  icon: Icon,
  label,
  value,
  sub,
  to,
  linkLabel,
  children,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  /** Una segunda línea, como «8 altas este mes». */
  sub?: string;
  to: string;
  linkLabel: string;
  /** La vista previa de la tarjeta: nombres, filas… Va debajo del número. */
  children?: ReactNode;
}) {
  return (
    <div className="p-5 gap-3 flex flex-col">
      <div className="gap-2 flex items-center text-muted-foreground">
        <Icon size={16} aria-hidden />
        <p className="text-sm font-medium">{label}</p>
      </div>

      <div>
        <p className="text-3xl font-semibold tracking-[-0.02em] tabular-nums">
          {formatNumber(value)}
        </p>
        {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
      </div>

      {children}

      <Link
        to={to}
        className="text-xs font-medium mt-auto text-primary underline-offset-4 hover:underline"
      >
        {linkLabel}
      </Link>
    </div>
  );
}
