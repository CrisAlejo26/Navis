import type { CustomTableColumn, RowFilter } from '@navis/shared';
import { Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { FiltersBar } from '@/components/tables/filters-bar';
import { Button } from '@/components/ui/button';
import { SearchField } from '@/components/ui/search-field';
import { Select } from '@/components/ui/select';

/** Buscar, ordenar, filtrar y añadir: la barra de la cuadrícula (D14–D19, D28). */
export function RowsGridToolbar({
  columns,
  search,
  onSearch,
  sort,
  order,
  onSort,
  filters,
  onFilters,
  onAdd,
}: {
  columns: readonly CustomTableColumn[];
  search: string;
  onSearch: (value: string) => void;
  sort: string | undefined;
  order: 'asc' | 'desc';
  onSort: (sort: string | undefined, order: 'asc' | 'desc') => void;
  filters: RowFilter[];
  onFilters: (filters: RowFilter[]) => void;
  onAdd?: () => void;
}) {
  const { t } = useTranslation();
  const sortable = columns.filter((one) => one.type !== 'password');

  return (
    <div className="gap-3 flex flex-col">
      <div className="gap-2 flex flex-wrap items-center">
        <SearchField
          value={search}
          onChange={onSearch}
          label={t('tables.search')}
          className="min-w-0 flex-1"
        />

        <Select
          size="md"
          aria-label={t('tables.sortBy')}
          value={`${sort ?? ''}:${order}`}
          onChange={(event) => {
            const [key, dir] = event.target.value.split(':');
            onSort(key || undefined, dir === 'asc' ? 'asc' : 'desc');
          }}
          className="w-auto"
        >
          <option value=":desc">{t('tables.sortNewest')}</option>
          <option value=":asc">{t('tables.sortOldest')}</option>
          {sortable.map((column) => (
            <optgroup key={column.key} label={column.label}>
              <option value={`${column.key}:asc`}>{t('tables.sortAsc')}</option>
              <option value={`${column.key}:desc`}>{t('tables.sortDesc')}</option>
            </optgroup>
          ))}
        </Select>

        {onAdd && (
          <Button size="md" onClick={onAdd}>
            <Plus size={16} aria-hidden />
            {t('tables.newRow')}
          </Button>
        )}
      </div>

      <FiltersBar columns={columns} filters={filters} onChange={onFilters} />
    </div>
  );
}
