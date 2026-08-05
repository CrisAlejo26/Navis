import type { DreamState } from '@navis/shared';
import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/cn';
import { STATE_ICON, STATE_TONE } from '@/lib/dreams/state-icons';

/**
 * El estado de un sueño, con su icono y su color.
 *
 * El icono acompaña y **el texto informa** (Regla 3 §7): una pastilla que solo
 * cambiase de color no diría nada a quien no lo distingue.
 */
export function DreamStateBadge({ state, className }: { state: DreamState; className?: string }) {
  const { t } = useTranslation();
  const Icon = STATE_ICON[state];

  return (
    <span
      className={cn(
        'gap-1.5 px-2 py-0.5 font-medium inline-flex items-center rounded-full border text-[11px]',
        STATE_TONE[state],
        className,
      )}
    >
      <Icon size={11} aria-hidden />
      {t(`dreams.state.${state}`)}
    </span>
  );
}
