import type { CustomTableColumn, RowFilter } from '@navis/shared';
import { BookmarkPlus, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { ActiveFiltersRow } from '@/components/tables/active-filters-row';
import { FilterMenu } from '@/components/tables/filter-menu';
import { Button } from '@/components/ui/button';
import { SearchField } from '@/components/ui/search-field';
import { Select } from '@/components/ui/select';

/**
 * Buscar, ordenar, filtrar y añadir: la barra de la cuadrícula (D14–D19,
 * D28), ahora **en una sola fila** — los filtros activos viven en sus chips,
 * y los que todavía no hay se añaden desde el menú. Nada ocupa sitio antes
 * de que alguien lo pida.
 */
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
    onSaveView,
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
    /** Con `tables.manage`, guardar los filtros y el orden como vista (D5). */
    onSaveView?: () => void;
}) {
    const { t } = useTranslation();
    const sortable = columns.filter((one) => one.type !== 'password');

    return (
        <div className="gap-2 flex flex-col">
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

                <FilterMenu columns={columns} filters={filters} onChange={onFilters} />

                {onSaveView && filters.length > 0 && (
                    <Button
                        variant="ghost"
                        size="md"
                        aria-label={t('tables.filters.saveAsView')}
                        title={t('tables.filters.saveAsView')}
                        onClick={onSaveView}
                    >
                        <BookmarkPlus size={16} aria-hidden />
                    </Button>
                )}

                {onAdd && (
                    <Button size="md" onClick={onAdd}>
                        <Plus size={16} aria-hidden />
                        {t('tables.newRow')}
                    </Button>
                )}
            </div>

            <ActiveFiltersRow columns={columns} filters={filters} onChange={onFilters} />
        </div>
    );
}
