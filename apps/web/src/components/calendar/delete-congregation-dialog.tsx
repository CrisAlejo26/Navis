import { useDeleteCongregation } from '@navis/api-client';
import type { Congregation } from '@navis/shared';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { api } from '@/lib/api';
import { toast } from '@/lib/toast';

/**
 * Baja de una sede. Nada se borra de un clic: lo que se va a perder se dice
 * antes, con su nombre, y el botón nombra la acción (`ConfirmDialog`).
 */
export function DeleteCongregationDialog({
  congregation,
  onClose,
}: {
  congregation: Congregation | null;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const remove = useDeleteCongregation(api);
  const [error, setError] = useState<string | null>(null);

  const close = () => {
    setError(null);
    onClose();
  };

  const confirm = () => {
    if (!congregation) return;

    remove.mutate(congregation.id, {
      onSuccess: () => {
        close();
        toast.success(t('calendar.congregationDeleted', { name: congregation.name }));
      },
      onError: () => {
        setError(t('calendar.lastCongregation'));
      },
    });
  };

  return (
    <ConfirmDialog
      open={congregation !== null}
      onClose={close}
      onConfirm={confirm}
      title={t('calendar.deleteTitle', { name: congregation?.name ?? '' })}
      description={t('calendar.deleteCongregationBody')}
      confirmLabel={t('common.delete')}
      destructive
      isPending={remove.isPending}
      error={error}
    />
  );
}
