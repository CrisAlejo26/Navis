import { useDeleteTeaching } from '@navis/api-client';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { api } from '@/lib/api';
import { toast } from '@/lib/toast';

/** Lo mínimo para confirmar: el título es lo que identifica a una enseñanza. */
export interface DeletableTeaching {
  id: string;
  title: string;
}

export function DeleteTeachingDialog({
  teaching,
  onClose,
  onDeleted,
}: {
  teaching: DeletableTeaching | null;
  onClose: () => void;
  /** Desde la ficha hay que volver al listado; desde el listado, no. */
  onDeleted?: () => void;
}) {
  const { t } = useTranslation();
  const remove = useDeleteTeaching(api);
  const [error, setError] = useState<string | null>(null);

  return (
    <ConfirmDialog
      open={Boolean(teaching)}
      onClose={onClose}
      destructive
      isPending={remove.isPending}
      error={error}
      title={t('teachings.deleteTitle', { title: teaching?.title ?? '' })}
      description={t('teachings.deleteBody')}
      confirmLabel={t('common.delete')}
      onConfirm={() => {
        if (!teaching) return;

        remove.mutate(teaching.id, {
          onSuccess: () => {
            toast.success(t('teachings.removed'));
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
