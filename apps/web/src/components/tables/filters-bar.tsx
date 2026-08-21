import type { CustomTableColumn, RowFilter } from '@navis/shared';

import { ClearFiltersButton } from '@/components/ui/clear-filters-button';
import { filterFor, withFilter } from '@/lib/tables/filters';
import { ColumnFilterControl } from '@/components/tables/column-filter-control';

/**
 * La barra de filtros de una tabla, calculada desde sus columnas activas
 * (RFC 0021 D28): añadir o borrar una columna cambia esta barra sola.
 *
 * La etiqueta de cada filtro es solo el nombre de la columna: el tipo ya lo
 * dice la forma del control (un calendario para fecha, chips para
 * selección…), y repetirlo en texto era ruido, no información.
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
  const filtrables = columns.filter((one) => one.type !== 'password');

  if (filtrables.length === 0) return null;

  return (
    <div className="gap-3 flex flex-col">
      {/* Una rejilla, no un reguero: cada filtro ocupa la misma columna y se
          alinea arriba, sea cual sea su alto — el de fecha crece hacia
          abajo con sus atajos, sin desplazar la etiqueta de sus vecinos. */}
      <div className="gap-x-4 gap-y-3 grid grid-cols-[repeat(auto-fill,minmax(13rem,1fr))] items-start">
        {filtrables.map((column) => (
          <ColumnFilterControl
            key={column.key}
            column={column}
            filter={filterFor(filters, column.key)}
            label={column.label}
            onChange={(filter) => {
              onChange(withFilter(filters, column.key, filter));
            }}
          />
        ))}
      </div>

      <div className="flex justify-end">
        <ClearFiltersButton
          count={filters.length}
          onClear={() => {
            onChange([]);
          }}
        />
      </div>
    </div>
  );
}
