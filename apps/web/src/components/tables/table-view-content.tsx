import type { CustomTableColumn, CustomTableView } from '@navis/shared';

import { KanbanBoard } from '@/components/tables/kanban-board';
import { RowsGrid } from '@/components/tables/rows-grid';
import { TableCalendarView } from '@/components/tables/table-calendar-view';
import { GRID_VIEW } from '@/lib/tables/use-active-view';

/** Cuadrícula, tablero o calendario, según la vista activa (D24). */
export function TableViewContent({
    tableId,
    accent,
    activeId,
    active,
    columns,
    editable,
    canManage,
    linked,
}: {
    tableId: string;
    accent: string;
    activeId: string;
    active: CustomTableView | undefined;
    columns: readonly CustomTableColumn[];
    editable: boolean;
    /** `tables.manage`: crear vistas y guardarles los filtros (D5). */
    canManage: boolean;
    /** La tabla enlazada a creyentes (RFC 0025 D7). */
    linked?: boolean;
}) {
    if (activeId !== GRID_VIEW && active?.type === 'kanban') {
        return (
            <KanbanBoard
                key={active.id}
                tableId={tableId}
                view={active}
                columns={columns}
                editable={editable}
                canManage={canManage}
            />
        );
    }

    if (activeId !== GRID_VIEW && active?.type === 'calendar') {
        return (
            <TableCalendarView
                key={active.id}
                tableId={tableId}
                view={active}
                columns={columns}
                editable={editable}
                canManage={canManage}
            />
        );
    }

    return (
        <RowsGrid
            tableId={tableId}
            accent={accent}
            columns={columns}
            editable={editable}
            canManage={canManage}
            linked={linked}
        />
    );
}
