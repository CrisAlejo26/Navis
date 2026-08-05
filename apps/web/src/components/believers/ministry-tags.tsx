import type { MinistryCatalog } from '@navis/shared';
import { useTranslation } from 'react-i18next';

import { accentVars } from '@/lib/accents';
import { cn } from '@/lib/cn';

/**
 * Las labores de un hermano, cada una de su color.
 *
 * Recibe los **slugs** que tiene la persona y el catálogo, y resuelve una
 * contra el otro: lo guardado es el slug, y el nombre y el color viven en el
 * catálogo, que se puede renombrar sin tocar a nadie.
 *
 * Un slug que ya no esté en el catálogo —una labor borrada— se enseña tal cual
 * en vez de desaparecer: que alguien la tuviera sigue siendo verdad.
 */
export function MinistryTags({
  slugs,
  catalog,
  max,
  className,
}: {
  slugs: readonly string[];
  catalog: readonly MinistryCatalog[];
  /** Cuántas caben antes de resumir en «+2». Sin él, todas. */
  max?: number;
  className?: string;
}) {
  const { t } = useTranslation();
  if (slugs.length === 0) return null;

  const shown = max === undefined ? slugs : slugs.slice(0, max);
  const rest = slugs.length - shown.length;

  return (
    <span className={cn('gap-1 flex flex-wrap items-center', className)}>
      {shown.map((slug) => {
        const ministry = catalog.find((one) => one.slug === slug);

        return (
          <span
            key={slug}
            style={ministry ? accentVars(ministry.accent) : undefined}
            className={cn(
              // **Cuadrada y con carril**, frente a la píldora con punto de un
              // don: son dos vocabularios distintos —lo que alguien *tiene* y
              // para lo que *está disponible*— y en la misma pantalla se
              // confundían. La forma los distingue sin leer el rótulo.
              'gap-1.5 px-2 py-0.5 inline-flex items-center rounded-md text-[11px]',
              ministry
                ? 'border border-[color-mix(in_oklab,var(--acento)_35%,transparent)] bg-[color-mix(in_oklab,var(--acento)_10%,transparent)] text-foreground/85'
                : 'border border-dashed text-muted-foreground',
            )}
          >
            <span
              aria-hidden
              className={cn(
                'h-3 w-1 rounded-sm',
                ministry ? 'bg-[var(--acento)]' : 'bg-muted-foreground/50',
              )}
            />
            {ministry?.name ?? slug}
          </span>
        );
      })}

      {/* «+2» a secas: la clave es la de los dones porque el texto no nombra
          nada, es solo el número que falta. */}
      {rest > 0 && (
        <span className="px-1.5 py-0.5 rounded-md text-[11px] text-muted-foreground tabular-nums">
          {t('believers.moreGifts', { count: rest })}
        </span>
      )}
    </span>
  );
}
