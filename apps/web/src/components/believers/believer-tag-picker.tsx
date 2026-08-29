import type { BelieverTag } from '@navis/shared';
import { Star } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { accentVars } from '@/lib/accents';
import { cn } from '@/lib/cn';

/**
 * Las etiquetas de una persona: se marcan cuantas se quiera, y **una** de las
 * marcadas se destaca para la tabla del listado.
 *
 * No es un desplegable, como el de dones: verlas todas a la vez y pulsar es
 * menos trabajo que abrir, buscar y cerrar. La apagada del catálogo no se
 * propone, pero si alguien ya la tenía sigue saliendo.
 *
 * El destacado va en una segunda fila, de **las que ya tiene**: pulsarla lo
 * activa —y apaga el anterior— y volver a pulsarla lo quita, que es el «pueda
 * quitarla» de la tabla. La primera etiqueta de la lista es la que sale si no
 * se destaca ninguna.
 */
export function BelieverTagPicker({
  tags,
  selected,
  featuredId,
  onToggle,
  onSetFeatured,
  label,
}: {
  tags: readonly BelieverTag[];
  selected: readonly string[];
  featuredId: string | null;
  onToggle: (id: string) => void;
  onSetFeatured: (id: string | null) => void;
  label: string;
}) {
  const { t } = useTranslation();
  const shown = tags.filter((tag) => tag.isActive || selected.includes(tag.id));
  const assigned = tags.filter((tag) => selected.includes(tag.id));

  return (
    <fieldset className="gap-2 flex flex-col">
      <legend className="text-sm font-medium">{label}</legend>

      {shown.length === 0 ? (
        <p className="text-xs text-muted-foreground">{t('believerTags.empty')}</p>
      ) : (
        <>
          <div className="gap-1.5 flex flex-wrap">
            {shown.map((tag) => {
              const active = selected.includes(tag.id);

              return (
                <button
                  key={tag.id}
                  type="button"
                  aria-pressed={active}
                  style={accentVars(tag.accent)}
                  onClick={() => {
                    onToggle(tag.id);
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
                  {tag.name}
                </button>
              );
            })}
          </div>

          {assigned.length > 0 && (
            <div className="gap-1.5 flex flex-col">
              <span className="gap-1 text-xs flex items-center text-muted-foreground">
                <Star size={12} aria-hidden />
                {t('believerTags.tableLabel')}
              </span>

              <div className="gap-1.5 flex flex-wrap">
                {assigned.map((tag) => {
                  const featured = tag.id === featuredId;

                  return (
                    <button
                      key={tag.id}
                      type="button"
                      aria-pressed={featured}
                      title={t('believerTags.tableHint')}
                      style={accentVars(tag.accent)}
                      onClick={() => {
                        onSetFeatured(featured ? null : tag.id);
                      }}
                      className={cn(
                        'h-8 gap-1.5 px-3 text-xs inline-flex cursor-pointer items-center rounded-full border',
                        'transition-[background-color,border-color] duration-200',
                        'focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
                        featured
                          ? 'border-[var(--acento)] bg-[color-mix(in_oklab,var(--acento)_14%,transparent)] text-foreground'
                          : 'border-transparent bg-muted text-muted-foreground hover:text-foreground',
                      )}
                    >
                      <Star
                        size={12}
                        aria-hidden
                        className={featured ? 'fill-[var(--acento)] text-[var(--acento)]' : ''}
                      />
                      {tag.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </fieldset>
  );
}
