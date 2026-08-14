import { useDeleteTableColumn, useReorderTableColumns } from '@navis/api-client';
import type { CustomTableColumn } from '@navis/shared';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ColumnForm } from '@/components/tables/column-form';
import { ColumnRow } from '@/components/tables/column-row';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Dialog } from '@/components/ui/dialog';
import { api } from '@/lib/api';
import { toast } from '@/lib/toast';

type View = { kind: 'list' } | { kind: 'create' } | { kind: 'edit'; column: CustomTableColumn };

/** El diálogo de columnas de una tabla (RFC 0021, «Las columnas»). */
export function ColumnsDialog({
  open,
  onClose,
  tableId,
  columns,
}: {
  open: boolean;
  onClose: () => void;
  tableId: string;
  columns: readonly CustomTableColumn[];
}) {
  const { t } = useTranslation();
  const reorder = useReorderTableColumns(api);
  const remove = useDeleteTableColumn(api);
  const [view, setView] = useState<View>({ kind: 'list' });
  const [arrastrando, setArrastrando] = useState<number | null>(null);
  const [destino, setDestino] = useState<number | null>(null);
  const [borrando, setBorrando] = useState<CustomTableColumn | null>(null);

  const close = () => {
    setView({ kind: 'list' });
    onClose();
  };

  const mover = (from: number, to: number) => {
    if (from === to || to < 0 || to >= columns.length) return;

    const orden = columns.map((one) => one.id);
    const [movido] = orden.splice(from, 1);
    if (movido) orden.splice(to, 0, movido);

    reorder.mutate({ tableId, columnIds: orden });
  };

  const title =
    view.kind === 'create'
      ? t('tables.newColumn')
      : view.kind === 'edit'
        ? t('tables.editColumn')
        : t('tables.columns');

  return (
    <>
      <Dialog open={open} onClose={close} title={title}>
        {view.kind === 'list' ? (
          <div className="gap-4 flex flex-col">
            <ol className="rounded-xl border">
              {columns.map((column, index) => (
                <ColumnRow
                  key={column.id}
                  column={column}
                  index={index}
                  total={columns.length}
                  dragging={arrastrando === index}
                  onMove={mover}
                  onDragStart={() => {
                    setArrastrando(index);
                  }}
                  onDragOver={() => {
                    setDestino(index);
                  }}
                  onDrop={() => {
                    if (arrastrando !== null && destino !== null) mover(arrastrando, destino);
                    setArrastrando(null);
                    setDestino(null);
                  }}
                  onEdit={() => {
                    setView({ kind: 'edit', column });
                  }}
                  onDelete={() => {
                    setBorrando(column);
                  }}
                />
              ))}
            </ol>

            <Button
              variant="secondary"
              onClick={() => {
                setView({ kind: 'create' });
              }}
            >
              <Plus size={15} aria-hidden />
              {t('tables.newColumn')}
            </Button>
          </div>
        ) : (
          <ColumnForm
            tableId={tableId}
            column={view.kind === 'edit' ? view.column : undefined}
            onSaved={() => {
              setView({ kind: 'list' });
            }}
          />
        )}
      </Dialog>

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
                toast.success(t('tables.columnDeleted'));
                setBorrando(null);
              },
            },
          );
        }}
        title={t('tables.deleteColumn')}
        description={t('tables.deleteColumnExplain')}
        confirmLabel={t('common.delete')}
        destructive
        isPending={remove.isPending}
      />
    </>
  );
}
