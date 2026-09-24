import { useUpdateTableRow, useUpdateTableView } from '@navis/api-client';
import type { CustomTableColumn, CustomTableRow, CustomTableView, RowFilter } from '@navis/shared';
import { Columns3 } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ActiveFiltersRow } from '@/components/tables/active-filters-row';
import { FilterMenu } from '@/components/tables/filter-menu';
import { KanbanLane } from '@/components/tables/kanban-lane';
import { RowForm } from '@/components/tables/row-form';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { api } from '@/lib/api';
import { announceFilterChange } from '@/lib/tables/filter-announce';
import { toast } from '@/lib/toast';

/**
 * El tablero (RFC 0021 D25–D26): un carril por opción de la columna elegida,
 * cada uno con su propia página. Arrastrar una tarjeta a otro carril es un
 * `PATCH` que cambia el valor de esa columna — no hay orden manual (D14).
 *
 * Los filtros de la vista (D24) se aplican a todos los carriles y se pueden
 * afinar aquí: cambiarlos marca la vista como sucia y «Actualizar vista»
 * guarda el cambio (D5). Se montan con `key={view.id}` para que cada vista
 * arranque con los suyos, no con los de la anterior.
 */
export function KanbanBoard({
    tableId,
    view,
    columns,
    editable,
    canManage,
}: {
    tableId: string;
    view: CustomTableView;
    columns: readonly CustomTableColumn[];
    editable: boolean;
    canManage: boolean;
}) {
    const { t } = useTranslation();
    const update = useUpdateTableRow(api);
    const updateView = useUpdateTableView(api);
    const [draggingId, setDraggingId] = useState<string | null>(null);
    const [editando, setEditando] = useState<CustomTableRow | null>(null);
    const [filters, setFilters] = useState<RowFilter[]>(view.filters);
    const [sucia, setSucia] = useState(false);

    const groupColumn = columns.find(
        (one) => one.key === view.groupBy && one.type === 'single_select',
    );
    // La columna de agrupación no se filtra: los carriles **son** sus valores.
    const otherColumns = columns.filter(
        (one) => one.key !== view.groupBy && one.type !== 'password',
    );

    if (!groupColumn || !groupColumn.options || groupColumn.options.length === 0) {
        return <EmptyState icon={Columns3} title={t('tables.noSingleSelectForKanban')} />;
    }

    const setViewFilters = (next: RowFilter[]) => {
        announceFilterChange(filters, next, t);
        setFilters(next);
        setSucia(true);
    };

    const guardar = () => {
        updateView.mutate(
            { tableId, id: view.id, filters },
            {
                onSuccess: () => {
                    setSucia(false);
                    toast.success(t('tables.filters.viewUpdated'));
                },
            },
        );
    };

    return (
        <>
            <div className="gap-2 flex flex-col">
                <div className="gap-2 flex flex-wrap items-center justify-end">
                    <FilterMenu
                        columns={otherColumns}
                        filters={filters}
                        onChange={setViewFilters}
                    />
                    {canManage && sucia && (
                        <Button
                            variant="secondary"
                            size="md"
                            isLoading={updateView.isPending}
                            onClick={guardar}
                        >
                            {t('tables.filters.updateView')}
                        </Button>
                    )}
                </div>

                <ActiveFiltersRow
                    columns={otherColumns}
                    filters={filters}
                    onChange={setViewFilters}
                />
            </div>

            <div className="gap-3 min-h-0 pb-2 flex flex-1 items-stretch overflow-x-auto">
                {groupColumn.options.map((option) => (
                    <KanbanLane
                        key={option.value}
                        tableId={tableId}
                        groupByKey={groupColumn.key}
                        option={option}
                        columns={otherColumns}
                        extraFilters={filters}
                        editable={editable}
                        draggingId={draggingId}
                        onDragStartCard={setDraggingId}
                        onDragEndCard={() => {
                            setDraggingId(null);
                        }}
                        onDropCard={(optionValue) => {
                            if (!draggingId || !editable) return;
                            update.mutate(
                                {
                                    tableId,
                                    id: draggingId,
                                    data: { [groupColumn.key]: optionValue },
                                },
                                { onSuccess: () => toast.success(t('tables.rowSaved')) },
                            );
                            setDraggingId(null);
                        }}
                        onOpenRow={setEditando}
                    />
                ))}
            </div>

            {editando && (
                <RowForm
                    key={editando.id}
                    open
                    onClose={() => {
                        setEditando(null);
                    }}
                    tableId={tableId}
                    columns={columns}
                    row={editando}
                />
            )}
        </>
    );
}
