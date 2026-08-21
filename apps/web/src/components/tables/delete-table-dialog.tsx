import { useDeleteTable } from '@navis/api-client';
import type { CustomTable } from '@navis/shared';
import { useTranslation } from 'react-i18next';

import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { api } from '@/lib/api';
import { toast } from '@/lib/toast';

/**
 * Baja de una tabla, con sus columnas, filas y vistas.
 *
 * Aparte de `TableDialogs` por lo mismo que `DeleteListDialog`: esto solo
 * necesita la fila (`CustomTable`), no la ficha entera con sus columnas
 * (`CustomTableWithColumns`) — así lo puede abrir la barra lateral sin
 * pedirla. Sin navegar por su cuenta: quien la abre desde su propia ficha
 * pasa `onDeleted`.
 */
export function DeleteTableDialog({
  table,
  onClose,
  onDeleted,
}: {
  table: Pick<CustomTable, 'id' | 'name'> | null;
  onClose: () => void;
  onDeleted?: () => void;
}) {
  const { t } = useTranslation();
  const remove = useDeleteTable(api);

  return (
    <ConfirmDialog
      open={table !== null}
      onClose={onClose}
      onConfirm={() => {
        if (!table) return;

        remove.mutate(table.id, {
          onSuccess: () => {
            onClose();
            toast.success(t('tables.deleted', { name: table.name }));
            onDeleted?.();
          },
        });
      }}
      title={t('tables.delete')}
      description={t('tables.deleteExplain')}
      confirmLabel={t('common.delete')}
      destructive
      isPending={remove.isPending}
    />
  );
}
