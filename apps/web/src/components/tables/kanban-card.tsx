import type { CustomTableColumn, CustomTableRow } from '@navis/shared';

import { RowValueCell } from '@/components/tables/row-value-cell';
import { cn } from '@/lib/cn';

/**
 * Una tarjeta del tablero: la primera columna como título, un par más como
 * detalle — la misma idea que una ficha de la vista de móvil de la cuadrícula.
 */
export function KanbanCard({
  row,
  columns,
  draggable,
  dragging,
  onDragStart,
  onDragEnd,
  onClick,
}: {
  row: CustomTableRow;
  columns: readonly CustomTableColumn[];
  draggable: boolean;
  dragging: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
  onClick: () => void;
}) {
  const [titulo, ...resto] = columns;

  return (
    <button
      type="button"
      draggable={draggable}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onClick}
      className={cn(
        'p-3 gap-1.5 flex w-full flex-col rounded-lg border bg-card text-left transition-opacity',
        'focus-visible:ring-2 focus-visible:ring-ring',
        draggable && 'cursor-grab',
        dragging && 'opacity-40',
      )}
    >
      {titulo && (
        <p className="text-sm font-medium">
          <RowValueCell column={titulo} value={row.data[titulo.key]} />
        </p>
      )}
      {resto.slice(0, 2).map((column) => (
        <p key={column.key} className="text-xs text-muted-foreground">
          {column.label}: <RowValueCell column={column} value={row.data[column.key]} />
        </p>
      ))}
    </button>
  );
}
