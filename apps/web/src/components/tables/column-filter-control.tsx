import type { CustomTableColumn, RowFilter } from '@navis/shared';

import { CheckboxFilterControl } from '@/components/tables/filters/checkbox-filter';
import { DateFilterControl } from '@/components/tables/filters/date-filter';
import { NumericFilterControl } from '@/components/tables/filters/numeric-filter';
import { SelectFilterControl } from '@/components/tables/filters/select-filter';
import { TextFilterControl } from '@/components/tables/filters/text-filter';
import { NUMERIC_TYPES, TEXT_TYPES } from '@/lib/tables/column-types';

/**
 * El control de filtro que le toca a una columna, según su tipo (D28): un
 * despachador fino, cada forma vive en `filters/`. La etiqueta no repite el
 * tipo de dato — lo dice la propia forma del control (Regla 9 §2: nada de
 * texto que solo repite lo que ya se ve).
 */
export function ColumnFilterControl({
  column,
  filter,
  label,
  onChange,
}: {
  column: CustomTableColumn;
  filter: RowFilter | undefined;
  label: string;
  onChange: (filter: RowFilter | null) => void;
}) {
  if (TEXT_TYPES.has(column.type)) {
    return (
      <TextFilterControl columnKey={column.key} label={label} filter={filter} onChange={onChange} />
    );
  }

  if (NUMERIC_TYPES.has(column.type)) {
    return (
      <NumericFilterControl
        columnKey={column.key}
        label={label}
        filter={filter}
        onChange={onChange}
      />
    );
  }

  if (column.type === 'date') {
    return (
      <DateFilterControl columnKey={column.key} label={label} filter={filter} onChange={onChange} />
    );
  }

  if (column.type === 'checkbox') {
    return (
      <CheckboxFilterControl
        columnKey={column.key}
        label={label}
        filter={filter}
        onChange={onChange}
      />
    );
  }

  if (column.type === 'single_select' || column.type === 'multi_select') {
    return (
      <SelectFilterControl column={column} label={label} filter={filter} onChange={onChange} />
    );
  }

  return null;
}
