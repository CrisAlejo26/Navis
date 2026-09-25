import { useDeleteTableRow, useTableRows } from '@navis/api-client';
import {
    DEFAULT_PAGE_SIZE,
    type CustomTableColumn,
    type CustomTableRow,
    type RowFilter,
} from '@navis/shared';
import { AlertTriangle, ListFilter, Table2 } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { AddBelieversDialog } from '@/components/tables/add-believers-dialog';
import { BoundCell } from '@/components/tables/bound-cell';
import { RowActions } from '@/components/tables/row-actions';
import { RowForm } from '@/components/tables/row-form';
import { RowsGridToolbar } from '@/components/tables/rows-grid-toolbar';
import { RowValueCell } from '@/components/tables/row-value-cell';
import { FilterPopover } from '@/components/tables/filter-popover';
import { ViewForm } from '@/components/tables/view-form';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { DataTable } from '@/components/ui/data-table';
import { Pagination } from '@/components/ui/pagination';
import { TableCell, TableHeader } from '@/components/ui/table';
import { accentVars } from '@/lib/accents';
import { api } from '@/lib/api';
import { announceFilterChange } from '@/lib/tables/filter-announce';
import { encodeFilters, withFilter, filterFor } from '@/lib/tables/filters';
import { useRowArrivals } from '@/components/tables/use-row-arrivals';
import { useTableFilters } from '@/lib/tables/filters-url';
import { toast } from '@/lib/toast';
import { cn } from '@/lib/cn';

/**
 * La vista de cuadrícula (RFC 0021 D17–D19): la que siempre existe, paginada,
 * con búsqueda, orden y filtros calculados sobre las columnas activas.
 *
 * La fila de cabeceras lleva un tinte del acento de la tabla, y la columna por
 * la que se ordena se marca con el acento sólido — nunca blanco puro (D32).
 * Cada cabecera lleva su botón de filtro (D1) y los filtros activos viven en
 * la URL, no en un estado que se pierde al recargar (D4).
 */
export function RowsGrid({
    tableId,
    accent,
    columns,
    editable,
    canManage,
    linked,
}: {
    tableId: string;
    accent: string;
    columns: readonly CustomTableColumn[];
    editable: boolean;
    /** `tables.manage`: puede guardar los filtros como vista (D5). */
    canManage: boolean;
    /** La tabla enlazada al listado de creyentes: añadir abre el selector (RFC 0025 D7). */
    linked?: boolean;
}) {
    const { t } = useTranslation();
    const remove = useDeleteTableRow(api);

    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(DEFAULT_PAGE_SIZE);
    const [search, setSearch] = useState('');
    const [sort, setSort] = useState<string | undefined>(undefined);
    const [order, setOrder] = useState<'asc' | 'desc'>('desc');
    const [editando, setEditando] = useState<CustomTableRow | 'new' | null>(null);
    const [borrando, setBorrando] = useState<CustomTableRow | null>(null);
    const [guardandoVista, setGuardandoVista] = useState(false);
    const [anadiendo, setAnadiendo] = useState(false);

    const visibles = columns.filter((one) => one.isActive);
    const { filters, setFilters } = useTableFilters(visibles);

    const { data, isLoading, isError, refetch } = useTableRows(api, tableId, {
        page,
        limit,
        order,
        sort,
        search: search || undefined,
        filters: encodeFilters(filters),
    });

    const arrivals = useRowArrivals((data?.items ?? []).map((one) => one.id));

    const abrirFila = (row: CustomTableRow | 'new') => {
        setEditando(row);
    };
    const alternarOrden = (key: string) => {
        if (sort !== key) {
            setSort(key);
            setOrder('asc');
            return;
        }
        setOrder(order === 'asc' ? 'desc' : 'asc');
    };

    /** Aplica un lote de filtros y lo confirma: lo que cambia es que se añade
      o se quita uno — afinar un valor ya aplicado no repite el aviso (D3). */
    const aplicarFiltros = (value: RowFilter[]) => {
        announceFilterChange(filters, value, t);
        setFilters(value);
        setPage(1);
    };

    return (
        <div className="gap-4 flex flex-col">
            <RowsGridToolbar
                columns={visibles}
                search={search}
                onSearch={(value) => {
                    setSearch(value);
                    setPage(1);
                }}
                sort={sort}
                order={order}
                onSort={(value, dir) => {
                    setSort(value);
                    setOrder(dir);
                }}
                filters={filters}
                onFilters={aplicarFiltros}
                onAdd={
                    editable
                        ? () => {
                              if (linked) setAnadiendo(true);
                              else abrirFila('new');
                          }
                        : undefined
                }
                addLabel={linked ? t('tables.addBelievers') : undefined}
                onSaveView={canManage ? () => setGuardandoVista(true) : undefined}
            />

            <DataTable
                items={data?.items}
                isLoading={isLoading}
                isError={isError}
                onRetry={() => void refetch()}
                columnCount={visibles.length + (editable ? 1 : 0)}
                getKey={(row) => row.id}
                emptyIcon={Table2}
                emptyTitle={t('tables.emptyRows')}
                columns={
                    <>
                        {visibles.map((column) => (
                            <TableHeader
                                key={column.key}
                                style={accentVars(accent)}
                                sorted={column.key === sort ? order : false}
                                onSort={() => {
                                    alternarOrden(column.key);
                                }}
                                sortLabel={`${t('tables.sortBy')}: ${column.label}`}
                                className={cn(
                                    'group/th',
                                    column.key === sort
                                        ? 'bg-[var(--acento)]/25'
                                        : 'bg-[var(--acento)]/10',
                                )}
                                filter={
                                    <HeaderFilter
                                        column={column}
                                        filters={filters}
                                        onChange={aplicarFiltros}
                                    />
                                }
                            >
                                {column.label}
                            </TableHeader>
                        ))}
                        {editable && (
                            <TableHeader
                                style={accentVars(accent)}
                                className="w-24 bg-[var(--acento)]/10"
                            />
                        )}
                    </>
                }
                renderRow={(row) => (
                    <>
                        {visibles.map((column, index) => (
                            <TableCell key={column.key}>
                                <BoundCell
                                    column={column}
                                    row={row}
                                    linked={linked}
                                    arrival={arrivals.isNew(row.id) ? index : undefined}
                                />
                            </TableCell>
                        ))}
                        {editable && (
                            <TableCell>
                                {linked && !row.believer && (
                                    <span
                                        title={t('tables.believerGone')}
                                        className="mr-1 inline-flex align-middle text-warning"
                                    >
                                        <AlertTriangle size={14} aria-hidden />
                                        <span className="sr-only">{t('tables.believerGone')}</span>
                                    </span>
                                )}
                                <RowActions
                                    compact
                                    onEdit={() => {
                                        abrirFila(row);
                                    }}
                                    onDelete={() => {
                                        setBorrando(row);
                                    }}
                                />
                            </TableCell>
                        )}
                    </>
                )}
                renderCard={(row) => (
                    <div className="gap-2 flex flex-col">
                        {visibles.map((column, index) => (
                            <p
                                key={column.key}
                                className="gap-1 text-sm flex items-baseline justify-between"
                            >
                                <span className="text-muted-foreground">{column.label}</span>
                                <BoundCell
                                    column={column}
                                    row={row}
                                    linked={linked}
                                    arrival={arrivals.isNew(row.id) ? index : undefined}
                                />
                            </p>
                        ))}
                        {editable && (
                            <RowActions
                                compact={false}
                                onEdit={() => {
                                    abrirFila(row);
                                }}
                                onDelete={() => {
                                    setBorrando(row);
                                }}
                            />
                        )}
                    </div>
                )}
                footer={
                    data && (
                        <Pagination
                            page={page}
                            limit={limit}
                            total={data.total}
                            totalPages={data.totalPages}
                            onPageChange={setPage}
                            onLimitChange={(value) => {
                                setLimit(value);
                                setPage(1);
                            }}
                        />
                    )
                }
            />

            {editando && (
                <RowForm
                    key={editando === 'new' ? 'new' : editando.id}
                    open
                    onClose={() => {
                        setEditando(null);
                    }}
                    tableId={tableId}
                    columns={visibles}
                    row={editando === 'new' ? undefined : editando}
                    linked={linked}
                />
            )}

            {anadiendo && (
                <AddBelieversDialog
                    open
                    onClose={() => {
                        setAnadiendo(false);
                    }}
                    tableId={tableId}
                />
            )}

            {guardandoVista && (
                <ViewForm
                    key="guardar-vista"
                    open
                    onClose={() => {
                        setGuardandoVista(false);
                    }}
                    tableId={tableId}
                    columns={visibles}
                    initialFilters={filters}
                />
            )}

            <ConfirmDialog
                open={borrando !== null}
                onClose={() => {
                    setBorrando(null);
                }}
                onConfirm={() => {
                    if (!borrando) return;
                    remove.mutate(
                        { tableId, id: borrando.id },
                        {
                            onSuccess: () => {
                                toast.success(t('tables.rowDeleted'));
                                setBorrando(null);
                            },
                        },
                    );
                }}
                title={t('tables.deleteRow')}
                description={t('tables.deleteRowExplain')}
                confirmLabel={t('common.delete')}
                destructive
                isPending={remove.isPending}
            />
        </div>
    );
}

/** El botón de filtro de una cabecera: aparece al pasar el cursor y se queda
 * visible mientras esa columna tenga un filtro activo (D1). */
function HeaderFilter({
    column,
    filters,
    onChange,
}: {
    column: CustomTableColumn;
    filters: readonly RowFilter[];
    onChange: (filters: RowFilter[]) => void;
}) {
    const { t } = useTranslation();
    const filter = filterFor(filters, column.key);
    const activo = filter !== undefined;

    return (
        <FilterPopover
            column={column}
            filter={filter}
            onChange={(next) => {
                onChange(withFilter(filters, column.key, next));
            }}
            trigger={
                <button
                    type="button"
                    aria-label={t('tables.filters.menuButton', { label: column.label })}
                    className={cn(
                        'h-6 w-6 inline-flex cursor-pointer items-center justify-center rounded-sm transition-opacity duration-150',
                        'text-muted-foreground hover:text-foreground focus-visible:opacity-100 focus-visible:outline-none',
                        activo
                            ? 'text-[var(--acento)] opacity-100'
                            : 'opacity-0 group-hover/th:opacity-100',
                    )}
                >
                    <ListFilter size={13} aria-hidden />
                </button>
            }
        />
    );
}
