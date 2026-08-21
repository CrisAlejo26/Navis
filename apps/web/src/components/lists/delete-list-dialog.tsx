import { useDeleteList } from '@navis/api-client';
import type { List } from '@navis/shared';
import { useTranslation } from 'react-i18next';

import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { api } from '@/lib/api';
import { toast } from '@/lib/toast';

/**
 * Baja de una lista. Se despublica, se cortan las sesiones y los accesos la
 * pierden — el aviso lo dice antes de que pase.
 *
 * Aparte de `ListDialogs` para que la barra lateral la pueda abrir sin cargar
 * la ficha entera (`ListDetail`, con sus miembros): esto solo necesita la
 * fila, la misma que ya trae el listado. Sin navegar por su cuenta: quien la
 * abre desde su propia ficha pasa `onDeleted` para volver al tablón; desde la
 * barra lateral no hace falta moverse de donde se esté.
 */
export function DeleteListDialog({
  list,
  onClose,
  onDeleted,
}: {
  list: Pick<List, 'id' | 'name'> | null;
  onClose: () => void;
  onDeleted?: () => void;
}) {
  const { t } = useTranslation();
  const remove = useDeleteList(api);

  return (
    <ConfirmDialog
      open={list !== null}
      onClose={onClose}
      onConfirm={() => {
        if (!list) return;

        remove.mutate(list.id, {
          onSuccess: () => {
            onClose();
            toast.success(t('lists.deleted', { name: list.name }));
            onDeleted?.();
          },
        });
      }}
      title={t('lists.delete')}
      description={t('lists.deleteExplain')}
      confirmLabel={t('lists.delete')}
      destructive
      isPending={remove.isPending}
    />
  );
}
