import { useDeleteBeliever } from '@navis/api-client';
import { believerName, type BelieverListItem } from '@navis/shared';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { api } from '@/lib/api';
import { toast } from '@/lib/toast';

/**
 * Confirmación de la baja. El botón dice lo que va a pasar —«Eliminar a
 * Fulano»— y el cuerpo aclara que su bitácora no se pierde: es lo último que se
 * lee antes de pulsar.
 */
export function DeleteBelieverDialog({
  believer,
  onClose,
  onDeleted,
}: {
  believer: BelieverListItem | null;
  onClose: () => void;
  /** Desde la ficha hay que volver al listado; desde el listado, no. */
  onDeleted?: () => void;
}) {
  const { t } = useTranslation();
  const remove = useDeleteBeliever(api);
  const [error, setError] = useState<string | null>(null);
  const name = believer ? believerName(believer) : '';

  return (
    <ConfirmDialog
      open={Boolean(believer)}
      onClose={onClose}
      destructive
      isPending={remove.isPending}
      error={error}
      title={t('believers.deleteTitle', { name })}
      description={t('believers.deleteBody')}
      confirmLabel={t('common.delete')}
      onConfirm={() => {
        if (!believer) return;

        remove.mutate(believer.id, {
          onSuccess: () => {
            toast.success(t('believers.deleted', { name }));
            onClose();
            onDeleted?.();
          },
          onError: () => {
            setError(t('errors.generic'));
          },
        });
      }}
    />
  );
}
