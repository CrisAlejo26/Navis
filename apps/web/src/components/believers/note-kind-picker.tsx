import type { NoteKind } from '@navis/shared';
import { useTranslation } from 'react-i18next';

import { accentVars } from '@/lib/accents';
import { cn } from '@/lib/cn';
import { NOTE_ORDER, NOTE_STYLES } from '@/lib/believers/note-kinds';

/**
 * **El tipo va primero** (§7.6): es lo que decide el resto del formulario —si
 * es un don, aparece el selector de don— y por eso no es un desplegable, sino
 * seis pastillas con su icono, todas a la vista.
 */
export function NoteKindPicker({
  value,
  onChange,
  label,
}: {
  value: NoteKind;
  onChange: (kind: NoteKind) => void;
  label: string;
}) {
  const { t } = useTranslation();

  return (
    <fieldset className="gap-2 flex flex-col">
      <legend className="text-sm font-medium">{label}</legend>

      <div className="gap-1.5 flex flex-wrap">
        {NOTE_ORDER.map((kind) => {
          const { Icon, accent, labelKey } = NOTE_STYLES[kind];
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
