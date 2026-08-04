import type { Gift } from '@navis/shared';
import { useTranslation } from 'react-i18next';

import { accentVars } from '@/lib/accents';
import { cn } from '@/lib/cn';

/**
 * Los dones de un hermano, cada uno de su color (RFC 0003 §5.2).
 *
 * El nombre no se traduce (D6): es dato de la iglesia, igual que el de una
 * sede. Lo que sí va en los seis idiomas es el «+2» y el vacío.
 */
export function GiftTags({
  gifts,
  max,
  className,
}: {
  gifts: readonly Gift[];
  /** Cuántos caben antes de resumir en «+2». Sin él, todos. */
  max?: number;
  className?: string;
}) {
  const { t } = useTranslation();
  if (gifts.length === 0) return null;

  const shown = max === undefined ? gifts : gifts.slice(0, max);
  const rest = gifts.length - shown.length;

  return (
    <span className={cn('gap-1 flex flex-wrap items-center', className)}>
      {shown.map((gift) => (
        <span
          key={gift.id}
          style={accentVars(gift.accent)}
          className={cn(
            'gap-1.5 px-2 py-0.5 inline-flex items-center rounded-full text-[11px]',
            // El color va en el borde y en el punto, no en el fondo: cinco
            // etiquetas rellenas seguidas compiten con la sonda, que es lo que
            // esta pantalla quiere que se lea primero (§7.1).
            'border border-[color-mix(in_oklab,var(--acento)_45%,transparent)] text-foreground/85',
          )}
        >
          <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-[var(--acento)]" />
          {gift.name}
        </span>
      ))}

      {rest > 0 && (
        <span className="px-1.5 py-0.5 rounded-full text-[11px] text-muted-foreground tabular-nums">
          {t('believers.moreGifts', { count: rest })}
        </span>
      )}
    </span>
  );
}
