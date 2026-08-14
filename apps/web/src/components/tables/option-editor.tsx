import { ACCENT_PALETTE, MAX_SELECT_OPTIONS, type ColumnOption } from '@navis/shared';
import { Plus, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { accentVars } from '@/lib/accents';

export interface OptionDraft {
  value?: string;
  label: string;
  color?: string;
}

/**
 * Las opciones de una columna de selección única o múltiple (RFC 0021 D11).
 *
 * Cada opción lleva su color, del mismo `ACCENT_PALETTE` de siempre: es lo
 * que hace que un tablero agrupado por esta columna se lea por color antes
 * que por palabra (D32).
 */
export function OptionEditor({
  options,
  onChange,
}: {
  options: readonly OptionDraft[];
  onChange: (options: OptionDraft[]) => void;
}) {
  const { t } = useTranslation();

  const set = (index: number, patch: Partial<OptionDraft>) => {
    onChange(options.map((one, i) => (i === index ? { ...one, ...patch } : one)));
  };

  const add = () => {
    const color = ACCENT_PALETTE[options.length % ACCENT_PALETTE.length];
    onChange([...options, { label: '', color }]);
  };

  const remove = (index: number) => {
    onChange(options.filter((_, i) => i !== index));
  };

  return (
    <fieldset className="gap-2 flex flex-col">
      <legend className="mb-1 text-sm font-medium">{t('tables.options')}</legend>

      {options.map((option: OptionDraft, index) => (
        <div key={option.value ?? index} className="gap-2 flex items-center">
          <span
            aria-hidden
            style={accentVars(option.color ?? ACCENT_PALETTE[0])}
            className="h-3 w-3 shrink-0 rounded-full bg-[var(--acento)]"
          />
          <Input
            aria-label={t('tables.optionLabel')}
            value={option.label}
            onChange={(event) => {
              set(index, { label: event.target.value });
            }}
            className="flex-1"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={t('tables.removeOption')}
            onClick={() => {
              remove(index);
            }}
          >
            <X size={15} aria-hidden />
          </Button>
        </div>
      ))}

      {options.length < MAX_SELECT_OPTIONS && (
        <Button type="button" variant="secondary" size="sm" onClick={add} className="self-start">
          <Plus size={14} aria-hidden />
          {t('tables.addOption')}
        </Button>
      )}
    </fieldset>
  );
}
