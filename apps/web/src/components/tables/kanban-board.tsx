import { useUpdateTableRow } from '@navis/api-client';
import type { CustomTableColumn, CustomTableRow, CustomTableView } from '@navis/shared';
import { Columns3 } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { KanbanLane } from '@/components/tables/kanban-lane';
import { RowForm } from '@/components/tables/row-form';
import { EmptyState } from '@/components/ui/empty-state';
import { api } from '@/lib/api';
import { toast } from '@/lib/toast';

/**
 * El tablero (RFC 0021 D25–D26): un carril por opción de la columna elegida,
 * cada uno con su propia página. Arrastrar una tarjeta a otro carril es un
 * `PATCH` que cambia el valor de esa columna — no hay orden manual (D14).
 */
export function KanbanBoard({
  tableId,
  view,
  columns,
  editable,
}: {
  tableId: string;
  view: CustomTableView;
  columns: readonly CustomTableColumn[];
  editable: boolean;
}) {
  const { t } = useTranslation();
  const update = useUpdateTableRow(api);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [editando, setEditando] = useState<CustomTableRow | null>(null);

  const groupColumn = columns.find(
    (one) => one.key === view.groupBy && one.type === 'single_select',
  );
  const otherColumns = columns.filter((one) => one.key !== view.groupBy && one.type !== 'password');

  if (!groupColumn || !groupColumn.options || groupColumn.options.length === 0) {
    return <EmptyState icon={Columns3} title={t('tables.noSingleSelectForKanban')} />;
  }

  return (
    <>
      <div className="gap-3 min-h-0 pb-2 flex flex-1 items-stretch overflow-x-auto">
        {groupColumn.options.map((option) => (
          <KanbanLane
            key={option.value}
            tableId={tableId}
            groupByKey={groupColumn.key}
            option={option}
            columns={otherColumns}
            editable={editable}
            draggingId={draggingId}
            onDragStartCard={setDraggingId}
            onDragEndCard={() => {
              setDraggingId(null);
            }}
            onDropCard={(optionValue) => {
              if (!draggingId || !editable) return;
              update.mutate(
                { tableId, id: draggingId, data: { [groupColumn.key]: optionValue } },
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
