import type { CustomTableColumn, RowFilter } from '@navis/shared';
import { useTranslation } from 'react-i18next';

import { ClearFiltersButton } from '@/components/ui/clear-filters-button';
import { COLUMN_TYPE_LABEL_KEY } from '@/lib/tables/column-types';
import { filterFor, withFilter } from '@/lib/tables/filters';
import { ColumnFilterControl } from '@/components/tables/column-filter-control';

/**
 * La barra de filtros de una tabla, calculada desde sus columnas activas
 * (RFC 0021 D28): añadir o borrar una columna cambia esta barra sola.
 */
export function FiltersBar({
  columns,
  filters,
  onChange,
}: {
  columns: readonly CustomTableColumn[];
  filters: readonly RowFilter[];
  onChange: (filters: RowFilter[]) => void;
}) {
  const { t } = useTranslation();
  const filtrables = columns.filter((one) => one.type !== 'password');

  if (filtrables.length === 0) return null;

  return (
    <div className="gap-3 flex flex-wrap items-end">
      {filtrables.map((column) => (
        <div key={column.key} className="min-w-40">
          <ColumnFilterControl
            column={column}
            filter={filterFor(filters, column.key)}
            label={`${column.label} · ${t(COLUMN_TYPE_LABEL_KEY[column.type])}`}
            onChange={(filter) => {
              onChange(withFilter(filters, column.key, filter));
            }}
          />
        </div>
      ))}

      <ClearFiltersButton
        count={filters.length}
        onClear={() => {
          onChange([]);
        }}
      />
    </div>
  );
}
