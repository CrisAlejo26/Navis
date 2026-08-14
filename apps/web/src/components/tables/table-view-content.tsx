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
}: {
  tableId: string;
  accent: string;
  activeId: string;
  active: CustomTableView | undefined;
  columns: readonly CustomTableColumn[];
  editable: boolean;
}) {
  if (activeId !== GRID_VIEW && active?.type === 'kanban') {
    return <KanbanBoard tableId={tableId} view={active} columns={columns} editable={editable} />;
  }

  if (activeId !== GRID_VIEW && active?.type === 'calendar') {
    return (
      <TableCalendarView tableId={tableId} view={active} columns={columns} editable={editable} />
    );
  }

  return <RowsGrid tableId={tableId} accent={accent} columns={columns} editable={editable} />;
}
