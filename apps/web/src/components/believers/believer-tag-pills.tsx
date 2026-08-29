import type { BelieverTag } from '@navis/shared';
import { useTranslation } from 'react-i18next';

import { accentVars } from '@/lib/accents';
import { cn } from '@/lib/cn';

/**
 * Las etiquetas de un hermano, cada una de su color.
 *
 * La forma es la misma que los dones —píldora con punto— porque resuelven lo
 * mismo: vocabulario de la iglesia con color, para distinguirlo de un vistazo.
 * El nombre no se traduce: es dato de la iglesia, igual que el de una sede.
 */
export function BelieverTagPills({
  tags,
  max,
  className,
}: {
  tags: readonly BelieverTag[];
  /** Cuántas caben antes de resumir en «+2». Sin él, todas. */
  max?: number;
  className?: string;
}) {
  const { t } = useTranslation();
  if (tags.length === 0) return null;

  const shown = max === undefined ? tags : tags.slice(0, max);
  const rest = tags.length - shown.length;

  return (
    <span className={cn('gap-1 flex flex-wrap items-center', className)}>
      {shown.map((tag) => (
        <span
          key={tag.id}
          style={accentVars(tag.accent)}
          className={cn(
            'gap-1.5 px-2 py-0.5 inline-flex items-center rounded-full text-[11px]',
            'border border-[color-mix(in_oklab,var(--acento)_45%,transparent)] text-foreground/85',
          )}
        >
          <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-[var(--acento)]" />
          {tag.name}
        </span>
      ))}

      {rest > 0 && (
        <span className="px-1.5 py-0.5 rounded-full text-[11px] text-muted-foreground tabular-nums">
          {t('believers.moreTags', { count: rest })}
        </span>
      )}
    </span>
  );
}
