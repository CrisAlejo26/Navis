import { useTableRows } from '@navis/api-client';
import {
  DEFAULT_PAGE_SIZE,
  type ColumnOption,
  type CustomTableColumn,
  type CustomTableRow,
} from '@navis/shared';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { KanbanCard } from '@/components/tables/kanban-card';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { accentVars } from '@/lib/accents';
import { cn } from '@/lib/cn';

/**
 * Un carril del tablero: su propia página, cargada aparte (RFC 0021 D26). El
 * filtro reutiliza el mismo endpoint de filas que la cuadrícula — no hay
 * ninguna pieza nueva de carga por carril.
 */
export function KanbanLane({
  tableId,
  groupByKey,
  option,
  columns,
  editable,
  draggingId,
  onDragStartCard,
  onDragEndCard,
  onDropCard,
  onOpenRow,
}: {
  tableId: string;
  groupByKey: string;
  option: ColumnOption;
  columns: readonly CustomTableColumn[];
  editable: boolean;
  draggingId: string | null;
  onDragStartCard: (rowId: string) => void;
  onDragEndCard: () => void;
  onDropCard: (optionValue: string) => void;
  onOpenRow: (row: CustomTableRow) => void;
}) {
  const { t } = useTranslation();
  const [limit, setLimit] = useState(DEFAULT_PAGE_SIZE);
  const [over, setOver] = useState(false);

  const filters = JSON.stringify([
    { columnKey: groupByKey, operator: 'in', value: [option.value] },
  ]);
  const { data } = useTableRows(api, tableId, { page: 1, limit, order: 'desc', filters });

  return (
    <div
      onDragOver={(event) => {
        event.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => {
        setOver(false);
      }}
      onDrop={(event) => {
        event.preventDefault();
        setOver(false);
        onDropCard(option.value);
      }}
      style={accentVars(option.color ?? 'primary')}
      className={cn(
        'w-72 flex max-h-full shrink-0 flex-col rounded-xl border bg-[var(--acento)]/[0.06]',
        over && draggingId && 'ring-2 ring-[var(--acento)]',
      )}
    >
      <div className="px-3 py-2.5 gap-2 flex shrink-0 items-center border-b border-[var(--acento)]/20">
        <span aria-hidden className="h-2.5 w-2.5 shrink-0 rounded-full bg-[var(--acento)]" />
        <p className="text-sm font-semibold flex-1 truncate">{option.label}</p>
        <span className="text-xs text-muted-foreground tabular-nums">{data?.total ?? 0}</span>
      </div>

      <div className="p-2 gap-2 flex flex-1 flex-col overflow-y-auto">
        {data?.items.map((row) => (
          <KanbanCard
            key={row.id}
            row={row}
            columns={columns}
            draggable={editable}
            dragging={draggingId === row.id}
            onDragStart={() => {
              onDragStartCard(row.id);
            }}
            onDragEnd={onDragEndCard}
            onClick={() => {
              onOpenRow(row);
            }}
          />
        ))}

        {data && data.items.length < data.total && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setLimit((current) => current + DEFAULT_PAGE_SIZE);
            }}
          >
            {t('tables.loadMore')}
          </Button>
        )}
      </div>
    </div>
  );
}
