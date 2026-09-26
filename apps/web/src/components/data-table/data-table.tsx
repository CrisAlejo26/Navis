import type { RowData as TableRowData } from '@tanstack/react-table';
import { Download, type LucideIcon } from 'lucide-react';
import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { BulkActionsBar } from '@/components/data-table/bulk-actions-bar';
import { CardsView } from '@/components/data-table/cards-view';
import { FilterChips } from '@/components/data-table/filters/filter-chips';
import { PaginationBar } from '@/components/data-table/pagination-bar';
import { StatusLine } from '@/components/data-table/status-line';
import { TableExportDialog } from '@/components/data-table/table-export-dialog';
import { TableNotice } from '@/components/data-table/table-notice';
import { Skeleton } from '@/components/ui/skeleton';
import { TableView } from '@/components/data-table/table-view';
import { DataTableToolbar } from '@/components/data-table/toolbar';
import { cn } from '@/lib/cn';
import { defineBulkAction, type BulkAction } from '@/lib/data-table/bulk-actions';
import type { DataTableColumn } from '@/lib/data-table/columns';
import type { TableExportConfig } from '@/lib/data-table/export-config';
import type { DataTableSource } from '@/lib/data-table/source';
import { defaultPreferences } from '@/lib/data-table/table-preferences';
import { useDataTable } from '@/lib/data-table/use-data-table';
import type { DataTableState } from '@/lib/data-table/use-data-table-state';
import { useExportRows, type ExportScope } from '@/lib/data-table/use-export-rows';
import { useRowSelection, type RowSelection } from '@/lib/data-table/use-row-selection';

interface DataTableProps<TItem extends TableRowData> {
    /** Estables (un `useMemo`): de ellas cuelga la reconciliación de preferencias. */
    columns: readonly DataTableColumn<TItem>[];
    state: DataTableState;
    source: DataTableSource<TItem>;
    getKey: (item: TItem) => string;
    emptyIcon: LucideIcon;
    emptyTitle: string;
    /** La ficha propia de la pantalla para por debajo de `md`. */
    renderCard?: (item: TItem, index: number) => ReactNode;
    rowClassName?: (item: TItem) => string | undefined;
    rowStyle?: (item: TItem, index: number) => CSSProperties | undefined;
    searchLabel?: string;
    /** Lo que la pantalla añade a la barra: crear, cambiar de vista… */
    toolbarExtra?: ReactNode;
    /**
     * Otra forma de pintar las filas de la página en lugar de la tabla y las fichas
     * (una travesía, un calendario anual…). Todo lo demás —barra, filtros, chips,
     * carga, error, vacío y paginación— sigue siendo de la tabla, así que cada vista
     * comparte los mismos filtros y no tiene que reescribirlos.
     */
    body?: (items: readonly TItem[], selection: RowSelection<TItem> | undefined) => ReactNode;
    /**
     * Acciones sobre las filas marcadas. **Es el punto de extensión**: la pantalla
     * declara las suyas (`defineBulkAction`) y la tabla pinta las casillas y la
     * barra; no hay que tocarla. Con alguna, las casillas aparecen solas.
     */
    bulkActions?: readonly BulkAction<TItem>[];
    /** Fuerza las casillas aunque no haya acciones (para exportar la selección). */
    selectable?: boolean;
    /** Qué filas se pueden marcar. Por defecto, todas. */
    isSelectable?: (item: TItem) => boolean;
    /** El nombre de una fila para el lector de pantalla: «Seleccionar Pastor». */
    rowLabel?: (item: TItem) => string;
    /** Con esto la tabla se puede exportar: botón «Exportar» y «Exportar selección». */
    exportConfig?: TableExportConfig<TItem>;
}

const ALL_SELECTABLE = () => true;
const NO_ACTIONS: readonly never[] = [];

/**
 * La tabla de datos de Navis: buscar, filtrar, ordenar, paginar, elegir columnas,
 * marcar filas, exportar y, por debajo de `md`, fichas. La pantalla pone sus
 * columnas y su ficha; el resto —estado en la URL, preferencias, carga, error,
 * vacío— vive aquí (plan de la tabla reutilizable).
 */
export function DataTable<TItem extends TableRowData>({
    columns,
    state,
    source,
    getKey,
    emptyIcon,
    emptyTitle,
    renderCard,
    rowClassName,
    rowStyle,
    searchLabel,
    toolbarExtra,
    body,
    bulkActions = NO_ACTIONS,
    selectable,
    isSelectable = ALL_SELECTABLE,
    rowLabel,
    exportConfig,
}: DataTableProps<TItem>) {
    const { t } = useTranslation();
    const table = useDataTable({ columns, source, state, getKey });
    const { page, limit, sorts, filters, search } = state.request;
    const { isLoading, isError } = source;

    const items = table.getRowModel().rows.map((row) => row.original);
    const total = table.getRowCount();
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const isRefreshing = source.kind === 'server' && source.isFetching && !isLoading;

    // Si la página pedida ya no existe (se borró la última fila de la última
    // página, o el enlace es viejo), se vuelve a la última que sí.
    const { setPage } = state;
    useEffect(() => {
        if (!isLoading && !isError && page > totalPages) setPage(totalPages);
    }, [isLoading, isError, page, totalPages, setPage]);

    const labels = new Map(columns.map((column) => [column.id, column.label]));
    const { columnVisibility, columnOrder } = state.preferences;
    const hiddenColumns = columns.filter(
        (column) =>
            column.hideable !== false &&
            !column.filterOnly &&
            // Una columna que ya nace oculta no es «una que se ha ocultado»: solo se
            // cuentan las que la persona ha quitado.
            column.defaultVisible !== false &&
            columnVisibility[column.id] === false,
    ).length;
    // Lo que se ve, en su orden: las fichas genéricas y la exportación siguen lo mismo.
    const visibleColumns = columnOrder.flatMap((id) => {
        const column = columns.find((one) => one.id === id);
        return column && !column.filterOnly && columnVisibility[id] !== false ? [column] : [];
    });

    // Selección y exportación: opt-in. La selección se vacía al cambiar filtros o búsqueda.
    const selection = useRowSelection(getKey, JSON.stringify([filters, search]));
    const [exportScope, setExportScope] = useState<ExportScope | null>(null);
    const exportRows = useExportRows({
        scope: exportScope,
        table,
        source,
        selection,
    });

    // Con exportación, «Exportar selección» va siempre la primera. El compilador de
    // React memoiza esto solo: un `useMemo` a mano no encaja con lo que infiere.
    const exportSelection = defineBulkAction<TItem>({
        id: 'export',
        label: t('dataTable.export.selection'),
        description: t('dataTable.export.selectionHelp'),
        icon: Download,
        tone: 'success',
        keepSelection: true,
        run: () => {
            setExportScope('selection');
        },
    });
    const actions = exportConfig ? [exportSelection, ...bulkActions] : bulkActions;

    const hasSelection = selectable ?? actions.length > 0;
    const selectionProps = hasSelection
        ? {
              state: selection,
              getKey,
              isSelectable,
              rowLabel: rowLabel ?? (() => t('dataTable.selection.selectRow')),
          }
        : undefined;

    return (
        <div className="gap-4 flex flex-col">
            <DataTableToolbar
                columns={columns}
                state={state}
                searchLabel={searchLabel}
                onExport={
                    exportConfig
                        ? () => {
                              setExportScope('all');
                          }
                        : undefined
                }
            >
                {toolbarExtra}
            </DataTableToolbar>
            <div className="gap-2 flex flex-col">
                <StatusLine
                    from={total === 0 ? 0 : (page - 1) * limit + 1}
                    to={Math.min(page * limit, total)}
                    total={total}
                    sorts={sorts}
                    labels={labels}
                    onClearSort={() => {
                        state.setSorts([]);
                    }}
                    hiddenColumns={hiddenColumns}
                    onShowColumns={() => {
                        const { columnVisibility: visibility } = defaultPreferences(columns);
                        state.updatePreferences({ columnVisibility: visibility });
                    }}
                />

                <FilterChips
                    filters={filters}
                    columns={columns}
                    onRemove={(removed) => {
                        state.setFilters(filters.filter((one) => one !== removed));
                    }}
                    onClear={state.clearFilters}
                />
            </div>

            <div
                aria-busy={isLoading || isRefreshing}
                className={cn('transition-opacity duration-200', isRefreshing && 'opacity-60')}
            >
                {body ? (
                    isLoading ? (
                        <div className="gap-3 flex flex-col" aria-hidden>
                            {Array.from({ length: 3 }, (_, row) => (
                                <Skeleton key={row} className="h-16 w-full rounded-xl" />
                            ))}
                        </div>
                    ) : isError ? null : (
                        body(items, hasSelection ? selection : undefined)
                    )
                ) : (
                    <>
                        <TableView
                            table={table}
                            columns={columns}
                            state={state}
                            isLoading={isLoading}
                            isError={isError}
                            rowClassName={rowClassName}
                            rowStyle={rowStyle}
                            selection={selectionProps}
                        />
                        <CardsView
                            items={isError ? [] : items}
                            columns={visibleColumns}
                            getKey={getKey}
                            isLoading={isLoading}
                            renderCard={renderCard}
                            selection={selectionProps}
                        />
                    </>
                )}
                <TableNotice
                    isError={isError}
                    isEmpty={!isLoading && total === 0}
                    onRetry={source.onRetry}
                    emptyIcon={emptyIcon}
                    emptyTitle={emptyTitle}
                />
            </div>

            <PaginationBar
                page={page}
                limit={limit}
                totalPages={totalPages}
                onPageChange={state.setPage}
                onLimitChange={state.setLimit}
            />

            {hasSelection && (
                <BulkActionsBar
                    items={selection.items}
                    actions={actions}
                    onClear={selection.clear}
                />
            )}

            {exportConfig && exportScope && (
                <TableExportDialog
                    open
                    onClose={() => {
                        setExportScope(null);
                    }}
                    scope={exportScope}
                    columns={visibleColumns}
                    allColumns={columns}
                    rows={exportRows}
                    remote={source.kind === 'server'}
                    tableId={state.tableId}
                    config={exportConfig}
                    request={state.request}
                />
            )}
        </div>
    );
}
