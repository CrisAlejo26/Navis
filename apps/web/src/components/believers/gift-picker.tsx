import type { Gift } from '@navis/shared';
import { useTranslation } from 'react-i18next';

import { accentVars } from '@/lib/accents';
import { cn } from '@/lib/cn';

/**
 * Los dones de una persona, como etiquetas que se encienden (§7.6).
 *
 * No es un desplegable: son siete de serie y se marcan varios, así que verlos
 * todos a la vez y pulsar es menos trabajo que abrir, buscar y cerrar. El
 * apagado del catálogo no se propone, pero si alguien ya lo tenía sigue
 * saliendo: no se le quita por haber cambiado el vocabulario.
 */
export function GiftPicker({
  gifts,
  selected,
  onToggle,
  label,
}: {
  gifts: readonly Gift[];
  selected: readonly string[];
  onToggle: (id: string) => void;
  label: string;
}) {
  const { t } = useTranslation();
  const shown = gifts.filter((gift) => gift.isActive || selected.includes(gift.id));

  return (
    <fieldset className="gap-2 flex flex-col">
      <legend className="text-sm font-medium">{label}</legend>

      {shown.length === 0 ? (
        <p className="text-xs text-muted-foreground">{t('gifts.empty')}</p>
      ) : (
        <div className="gap-1.5 flex flex-wrap">
          {shown.map((gift) => {
            const active = selected.includes(gift.id);

            return (
              <button
                key={gift.id}
                type="button"
                aria-pressed={active}
                style={accentVars(gift.accent)}
                onClick={() => {
                  onToggle(gift.id);
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
                {gift.name}
              </button>
            );
          })}
        </div>
      )}
    </fieldset>
  );
}
