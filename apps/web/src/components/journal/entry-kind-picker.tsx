import type { EntryKind } from '@navis/shared';
import { useTranslation } from 'react-i18next';

import { accentVars } from '@/lib/accents';
import { cn } from '@/lib/cn';
import { ENTRY_KIND_ORDER, ENTRY_KIND_STYLES } from '@/lib/journal/entry-kind';

/**
 * **El tipo va primero** (§7.8): es la primera decisión visual del
 * formulario, a propósito — define de qué color va a salir la entrada.
 *
 * Siete pastillas con su icono y su color, en una fila que envuelve en dos si
 * hace falta (Regla 5 §6, el alemán las estira).
 */
export function EntryKindPicker({
  value,
  onChange,
  label,
}: {
  value: EntryKind;
  onChange: (kind: EntryKind) => void;
  label: string;
}) {
  const { t } = useTranslation();

  return (
    <fieldset className="gap-2 flex flex-col">
      <legend className="text-sm font-medium">{label}</legend>

      <div className="gap-1.5 flex flex-wrap">
        {ENTRY_KIND_ORDER.map((kind) => {
          const { Icon, accent, labelKey } = ENTRY_KIND_STYLES[kind];
          const active = kind === value;

          return (
            <button
              key={kind}
              type="button"
              aria-pressed={active}
              style={accentVars(accent)}
              onClick={() => {
                onChange(kind);
              }}
              className={cn(
                'h-9 gap-1.5 px-3 text-xs inline-flex cursor-pointer items-center rounded-lg border',
                'transition-[background-color,border-color,color] duration-200',
                'focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
                active
                  ? 'font-medium border-[var(--acento)] bg-[color-mix(in_oklab,var(--acento)_14%,transparent)] text-foreground'
                  : 'border-transparent bg-muted text-muted-foreground hover:text-foreground',
              )}
            >
              <Icon size={14} aria-hidden className={active ? 'text-[var(--acento)]' : undefined} />
              {t(labelKey)}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
