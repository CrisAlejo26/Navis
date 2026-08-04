import type { BelieverStatus } from '@navis/shared';
import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/cn';

/**
 * Cada estado con su punto. El color acompaña, **el texto informa** (Regla 3
 * §7): una pastilla que solo cambiase de color no diría nada a quien no lo
 * distingue.
 */
const DOTS: Record<BelieverStatus, string> = {
  activo: 'bg-success',
  nuevo: 'bg-primary',
  inactivo: 'bg-muted-foreground',
  trasladado: 'bg-muted-foreground/50',
};

export function StatusBadge({ status }: { status: BelieverStatus }) {
  const { t } = useTranslation();

  return (
    <span className="gap-1.5 px-2 py-0.5 font-medium inline-flex items-center rounded-full border text-[11px] text-foreground/80">
      <span aria-hidden className={cn('h-1.5 w-1.5 rounded-full', DOTS[status])} />
      {t(`believers.status.${status}`)}
    </span>
  );
}
