import { useDeleteProphecy } from '@navis/api-client';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { api } from '@/lib/api';
import { toast } from '@/lib/toast';

/** Lo mínimo para confirmar: el título es lo que identifica a una palabra. */
export interface DeletableProphecy {
  id: string;
  title: string;
}

/**
 * Confirmación del borrado. El cuerpo dice lo que se lleva por delante —la
 * palabra **y** lo que se anotó de ella—: es lo último que se lee antes de
 * pulsar, y aquí no hay copia de seguridad que valga.
 */
export function DeleteProphecyDialog({
  prophecy,
  onClose,
  onDeleted,
}: {
  prophecy: DeletableProphecy | null;
  onClose: () => void;
  /** Desde la ficha hay que volver al listado; desde el listado, no. */
  onDeleted?: () => void;
}) {
  const { t } = useTranslation();
  const remove = useDeleteProphecy(api);
  const [error, setError] = useState<string | null>(null);

  return (
    <ConfirmDialog
      open={Boolean(prophecy)}
      onClose={onClose}
      destructive
      isPending={remove.isPending}
      error={error}
      title={t('prophecies.deleteTitle', { title: prophecy?.title ?? '' })}
      description={t('prophecies.deleteBody')}
      confirmLabel={t('common.delete')}
      onConfirm={() => {
        if (!prophecy) return;

        remove.mutate(prophecy.id, {
          onSuccess: () => {
            toast.success(t('prophecies.removed'));
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
