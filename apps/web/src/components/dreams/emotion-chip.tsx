import type { Emotion } from '@navis/shared';

import { ACCENT_RAIL, accentVars } from '@/lib/accents';
import { cn } from '@/lib/cn';
import { useEmotionLabel } from '@/lib/dreams/emotion-label';

/**
 * Una emoción, con su color (RFC 0005 D7).
 *
 * El color viaja en la variable `--acento` y no en una clase: `bg-${color}` no
 * existiría, porque Tailwind solo compila las clases escritas. Es la misma
 * mecánica que las sedes del calendario y los dones (Regla 1).
 *
 * El punto de color **no informa solo**: al lado va siempre el nombre (Regla 3
 * §7), que además es lo único que dice cuál es en cada idioma (D4).
 */
export function EmotionChip({
  emotion,
  size = 'md',
  className,
}: {
  emotion: Emotion;
  size?: 'sm' | 'md';
  className?: string;
}) {
  const label = useEmotionLabel();

  return (
    <span
      style={accentVars(emotion.accent)}
      className={cn(
        'gap-1.5 font-medium inline-flex items-center rounded-full border',
        // El borde y el fondo salen del propio color, muy diluidos: es lo que
        // hace que doce pastillas seguidas se distingan sin gritar.
        'border-[var(--acento)]/35 bg-[var(--acento)]/10',
        size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-[11px]',
        className,
      )}
    >
      <span aria-hidden className={cn('size-1.5 shrink-0 rounded-full', ACCENT_RAIL)} />
      {label(emotion)}
    </span>
  );
}
