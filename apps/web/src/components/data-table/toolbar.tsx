import type { RowData as TableRowData } from '@tanstack/react-table';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { ColumnsMenu } from '@/components/data-table/columns-menu';
import { ExportButton } from '@/components/data-table/export-button';
import { ViewsMenu } from '@/components/data-table/views-menu';
import { AdvancedFilters } from '@/components/data-table/filters/advanced-filters';
import { FacetFilter } from '@/components/data-table/filters/facet-filter';
import { SortSelect } from '@/components/data-table/sort-select';
import { SearchField } from '@/components/ui/search-field';
import type { DataTableColumn } from '@/lib/data-table/columns';
import type { DataTableState } from '@/lib/data-table/use-data-table-state';

/**
 * Arriba de la tabla, en una sola fila y sin tarjeta alrededor: el buscador, los
 * filtros rápidos (un botón por columna de selección), «Filtros avanzados» y, al
 * final, lo que la pantalla añada (exportar, crear…). En pantallas estrechas
 * se apilan y se suma el selector de orden, que ahí sustituye a las cabeceras.
 */
export function DataTableToolbar<TItem extends TableRowData>({
    columns,
    state,
    searchLabel,
    onExport,
    children,
}: {
    columns: readonly DataTableColumn<TItem>[];
    state: DataTableState;
    searchLabel?: string;
    /** Con esto sale el botón «Exportar». */
    onExport?: () => void;
    children?: ReactNode;
}) {
    const { t } = useTranslation();
    const { filters } = state.request;
    const sortable = columns.filter((column) => column.sortable !== false);
    const filterable = columns.filter((column) => column.filterable);
    const hideable = columns.some((column) => column.hideable !== false && !column.filterOnly);
    const facets = filterable.filter((column) => column.facet && column.options?.length);
    const filterFor = (columnId: string) => filters.find((filter) => filter.columnId === columnId);

    // En un teléfono: buscador y acción principal en una fila, los filtros debajo y
    // el orden al final. Con `order` se reparte así sin duplicar ningún control; de
    // `sm` para arriba pasa a una sola fila: buscador, filtros y la acción al final.
    return (
        <div className="gap-3 flex flex-col">
            <div className="gap-2 flex flex-wrap items-center">
                <SearchField
                    value={state.request.search}
                    onChange={state.setSearch}
                    label={searchLabel ?? t('dataTable.search')}
                    className="min-w-0 sm:max-w-xs flex-1"
                />
                {children && <div className="sm:order-3 sm:ml-auto shrink-0">{children}</div>}
                {(facets.length > 0 || filterable.length > 0 || hideable || onExport) && (
                    <div className="gap-2 sm:order-2 sm:w-auto flex w-full flex-wrap items-center">
                        {facets.map((column) => (
                            <FacetFilter
                                key={column.id}
                                column={column}
                                filter={filterFor(column.id)}
                                onChange={(filter) => {
                                    state.setColumnFilter(column.id, filter);
                                }}
                            />
                        ))}
                        {filterable.length > 0 && (
                            <AdvancedFilters
                                columns={filterable}
                                filters={filters}
                                onSetFilter={state.setColumnFilter}
                                onClear={state.clearFilters}
                            />
                        )}
                        <ViewsMenu state={state} />
                        <ColumnsMenu columns={columns} state={state} />
                        {onExport && <ExportButton onClick={onExport} />}
                    </div>
                )}
            </div>
            {sortable.length > 0 && (
                <div className="md:hidden">
                    <SortSelect
                        options={sortable}
                        sorts={state.request.sorts}
                        onChange={state.setSorts}
                    />
                </div>
            )}
        </div>
    );
}
