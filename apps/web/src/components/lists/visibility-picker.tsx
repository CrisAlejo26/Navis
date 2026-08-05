import type { ListVisibility } from '@navis/shared';
import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/cn';
import {
  VISIBILITY_HINT_KEY,
  VISIBILITY_ICON,
  VISIBILITY_LABEL_KEY,
  VISIBILITY_ORDER,
} from '@/lib/lists/visibility';

/**
 * Los tres modos de visibilidad, **con su explicación en una línea** (RFC 0010
 * D9, §8.5).
 *
 * No es un interruptor con letra pequeña: son tres opciones que se leen enteras
 * antes de elegir, porque publicar es una decisión que no se deshace del todo
 * —la tarjeta queda cacheada en el chat de quien la recibió—.
 *
 * Es un grupo de radios de verdad: se recorre con las flechas y cada opción dice
 * lo que hace.
 */
export function VisibilityPicker({
  value,
  onChange,
  disabled,
}: {
  value: ListVisibility;
  onChange: (value: ListVisibility) => void;
  disabled?: boolean;
}) {
  const { t } = useTranslation();

  return (
    <fieldset className="gap-2 flex flex-col" disabled={disabled}>
      <legend className="mb-1 text-sm font-medium">{t('lists.mode')}</legend>

      {VISIBILITY_ORDER.map((mode) => {
        const Icon = VISIBILITY_ICON[mode];
        const active = mode === value;

        return (
          <label
            key={mode}
            htmlFor={`visibility-${mode}`}
            className={cn(
              'p-3 gap-3 flex cursor-pointer items-start rounded-lg border transition-colors duration-200',
              active ? 'border-primary bg-primary/8' : 'hover:bg-muted',
            )}
          >
            <input
              id={`visibility-${mode}`}
              type="radio"
              name="visibility"
              value={mode}
              checked={active}
              onChange={() => {
                onChange(mode);
              }}
              className="mt-0.5 size-4 shrink-0 cursor-pointer accent-primary focus-visible:ring-2 focus-visible:ring-ring"
            />
            <span className="gap-1.5 text-sm font-medium min-w-0 flex flex-wrap items-center">
              <Icon size={14} aria-hidden />
              {t(VISIBILITY_LABEL_KEY[mode])}
              <span className="text-xs font-normal w-full text-muted-foreground">
                {t(VISIBILITY_HINT_KEY[mode])}
              </span>
            </span>
          </label>
        );
      })}
    </fieldset>
  );
}
