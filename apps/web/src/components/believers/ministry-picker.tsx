import type { MinistryCatalog } from '@navis/shared';
import { useTranslation } from 'react-i18next';

import { accentVars } from '@/lib/accents';
import { cn } from '@/lib/cn';

/**
 * Las **labores** de una persona, como etiquetas que se encienden.
 *
 * Mismo gesto que los dones y por lo mismo: son siete de serie, se marcan
 * varias, y verlas todas y pulsar es menos trabajo que abrir un desplegable.
 *
 * Lo que se guarda es el **slug** y no el identificador de la fila del
 * catálogo: es lo que mira el calendario, y así renombrar una labor no cambia
 * a quién estaba disponible para ella.
 */
export function MinistryPicker({
  ministries,
  selected,
  onToggle,
  label,
}: {
  ministries: readonly MinistryCatalog[];
  selected: readonly string[];
  onToggle: (slug: string) => void;
  label: string;
}) {
  const { t } = useTranslation();
  // La apagada no se propone, pero si alguien ya la tenía sigue saliendo: no se
  // le quita por haber cambiado el vocabulario.
  const shown = ministries.filter((one) => one.isActive || selected.includes(one.slug));

  return (
    <fieldset className="gap-2 flex flex-col">
      <legend className="text-sm font-medium">{label}</legend>

      {shown.length === 0 ? (
        <p className="text-xs text-muted-foreground">{t('ministries.empty')}</p>
      ) : (
        <div className="gap-1.5 flex flex-wrap">
          {shown.map((ministry) => {
            const active = selected.includes(ministry.slug);

            return (
              <button
                key={ministry.id}
                type="button"
                aria-pressed={active}
                style={accentVars(ministry.accent)}
                onClick={() => {
                  onToggle(ministry.slug);
                }}
                className={cn(
                  'h-8 gap-1.5 px-3 text-xs inline-flex cursor-pointer items-center rounded-full border',
                  'transition-[background-color,border-color] duration-200',
                  'focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
                  active
                    ? 'border-[var(--acento)] bg-[color-mix(in_oklab,var(--acento)_14%,transparent)] text-foreground'
                    : 'border-transparent bg-muted text-muted-foreground hover:text-foreground',
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    'h-1.5 w-1.5 rounded-full',
                    active ? 'bg-[var(--acento)]' : 'bg-current opacity-40',
                  )}
                />
                {ministry.name}
              </button>
            );
          })}
        </div>
      )}
    </fieldset>
  );
}
