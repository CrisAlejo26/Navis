import { useDeleteTableRow, useTableRows } from '@navis/api-client';
import type { CustomTableColumn, CustomTableRow } from '@navis/shared';
import { BookmarkPlus, Plus, Table2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { DataTable } from '@/components/data-table/data-table';
import { AddBelieversDialog } from '@/components/tables/add-believers-dialog';
import { buildRowColumns } from '@/components/tables/row-columns';
import { RowActions } from '@/components/tables/row-actions';
import { RowForm } from '@/components/tables/row-form';
import { useRowArrivals } from '@/components/tables/use-row-arrivals';
import { ViewForm } from '@/components/tables/view-form';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { accentVars } from '@/lib/accents';
import { api } from '@/lib/api';
import { serverSource } from '@/lib/data-table/source';
import { useDataTableState } from '@/lib/data-table/use-data-table-state';
import { columnSpec, toRowFilters, toRowsQuery } from '@/lib/tables/row-columns';
import { toast } from '@/lib/toast';

/** La API ordena por una sola columna. */
const TABLE_OPTIONS = { singleSort: true };

/**
 * La vista de cuadrícula (RFC 0021 D17–D19): la que siempre existe, paginada,
 * con búsqueda, orden y filtros calculados sobre las columnas activas.
 *
 * Es la tabla de datos de Navis con columnas **que se conocen en tiempo de
 * ejecución**: las de esa tabla personalizada. Los filtros viven en la URL (D4) y
 * el orden, el tamaño de página y las columnas ocultas se recuerdan por usuario.
 * La tabla lleva el acento de la personalizada en el filete de cada fila.
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

    const [editando, setEditando] = useState<CustomTableRow | 'new' | null>(null);
    const [borrando, setBorrando] = useState<CustomTableRow | null>(null);
    const [guardandoVista, setGuardandoVista] = useState(false);
    const [anadiendo, setAnadiendo] = useState(false);

    const visibles = columns.filter((one) => one.isActive);
    // El estado solo necesita ids y tipos: se calcula sin esperar a las filas.
    const specs = useMemo(() => visibles.map(columnSpec), [visibles]);
    const state = useDataTableState(`tables.${tableId}`, specs, undefined, TABLE_OPTIONS);
    const query = useTableRows(api, tableId, toRowsQuery(state.request, visibles));
    const source = serverSource(query);
    const arrivals = useRowArrivals((query.data?.items ?? []).map((one) => one.id));

    const tableColumns = buildRowColumns(
        visibles,
        {
            editable,
            linked,
            arrival: (row, index) => (arrivals.isNew(row.id) ? index : undefined),
            onEdit: setEditando,
            onDelete: setBorrando,
        },
        t,
    );
    const rowFilters = toRowFilters(state.request.filters);

    const add = editable ? (
        <Button
            size="sm"
            className="max-sm:h-11"
            onClick={() => {
                if (linked) setAnadiendo(true);
                else setEditando('new');
            }}
        >
            <Plus size={16} aria-hidden />
            {linked ? t('tables.addBelievers') : t('tables.newRow')}
        </Button>
    ) : null;

    return (
        <div className="gap-4 flex flex-col">
            <DataTable
                columns={tableColumns}
                state={state}
                source={source}
                getKey={(row) => row.id}
                emptyIcon={Table2}
                emptyTitle={
                    state.request.filters.length > 0 || state.request.search
                        ? t('tables.noRowsMatch')
                        : t('tables.emptyRows')
                }
                searchLabel={t('tables.search')}
                rowClassName={() => 'border-l-[var(--acento)]'}
                rowStyle={() => accentVars(accent)}
                renderCard={(row, index) => (
                    <div className="gap-2 flex flex-col">
                        {tableColumns
                            .filter((column) => column.id !== 'actions')
                            .map((column) => (
                                <p
                                    key={column.id}
                                    className="gap-1 text-sm flex items-baseline justify-between"
                                >
                                    <span className="text-muted-foreground">{column.label}</span>
                                    {column.cell(row, index)}
                                </p>
                            ))}
                        {editable && (
                            <RowActions
                                compact={false}
                                onEdit={() => {
                                    setEditando(row);
                                }}
                                onDelete={() => {
                                    setBorrando(row);
                                }}
                            />
                        )}
                    </div>
                )}
                toolbarExtra={
                    <>
                        {canManage && rowFilters.length > 0 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="max-sm:h-11"
                                aria-label={t('tables.filters.saveAsView')}
                                title={t('tables.filters.saveAsView')}
                                onClick={() => {
                                    setGuardandoVista(true);
                                }}
                            >
                                <BookmarkPlus size={16} aria-hidden />
                            </Button>
                        )}
                        {add}
                    </>
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
                    initialFilters={rowFilters}
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
