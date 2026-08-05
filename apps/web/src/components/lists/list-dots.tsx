import type { ListSummary } from '@navis/shared';
import { useTranslation } from 'react-i18next';

import { accentVars } from '@/lib/accents';

/** Cuatro puntos y luego «+2»: más de cuatro dejan de leerse como puntos. */
const VISIBLES = 4;

/**
 * **Un punto por lista, en su color**, junto al nombre de una persona (RFC 0010
 * §8.7).
 *
 * Es la forma de ver desde el listado que ese nombre está hoy en un cartel. Los
 * puntos no informan solos: el conjunto lleva su etiqueta con los nombres, y al
 * pasar por encima sale el de cada uno (Regla 3 §7).
 */
export function ListDots({
  lists,
  listIds,
}: {
  lists: readonly ListSummary[];
  listIds: readonly string[] | undefined;
}) {
  const { t } = useTranslation();

  const suyas = lists.filter((one) => listIds?.includes(one.id));
  if (suyas.length === 0) return null;

  const visibles = suyas.slice(0, VISIBLES);
  const resto = suyas.length - visibles.length;

  return (
    <span
      className="gap-1 inline-flex shrink-0 items-center align-middle"
      aria-label={t('lists.dots', { names: suyas.map((one) => one.name).join(', ') })}
    >
      {visibles.map((one) => (
        <span
          key={one.id}
          title={one.name}
          style={accentVars(one.accent)}
          className="size-2 rounded-full bg-[var(--acento)]"
        />
      ))}
      {resto > 0 && (
        <span aria-hidden className="font-medium text-[10px] text-muted-foreground">
          +{resto}
        </span>
      )}
    </span>
  );
}
