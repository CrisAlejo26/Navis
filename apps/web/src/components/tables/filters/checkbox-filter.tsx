import type { RowFilter } from '@navis/shared';
import { useTranslation } from 'react-i18next';

import { Chip } from '@/components/ui/chip';

/** Casilla: sí/no/cualquiera como interruptor de tres posiciones (D28), en
 * vez de un desplegable — un clic en vez de abrir y elegir. */
export function CheckboxFilterControl({
  columnKey,
  label,
  filter,
  onChange,
}: {
  columnKey: string;
  label: string;
  filter: RowFilter | undefined;
  onChange: (filter: RowFilter | null) => void;
}) {
  const { t } = useTranslation();
  const current = filter?.value === true ? 'true' : filter?.value === false ? 'false' : '';

  const options: { value: '' | 'true' | 'false'; text: string }[] = [
    { value: '', text: t('tables.filters.any') },
    { value: 'true', text: t('common.yes') },
    { value: 'false', text: t('common.no') },
  ];

  return (
    <fieldset className="gap-2 flex flex-col">
      <legend className="text-sm font-medium text-foreground">{label}</legend>
      <div className="gap-1.5 flex flex-wrap">
        {options.map((one) => (
          <Chip
            key={one.value}
            active={current === one.value}
            onClick={() => {
              onChange(
                one.value === ''
                  ? null
                  : { columnKey, operator: 'equals', value: one.value === 'true' },
              );
            }}
          >
            {one.text}
          </Chip>
        ))}
      </div>
    </fieldset>
  );
}
