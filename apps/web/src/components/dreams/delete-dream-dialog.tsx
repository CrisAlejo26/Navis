import { useDeleteDream } from '@navis/api-client';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { api } from '@/lib/api';
import { toast } from '@/lib/toast';

/** Lo mínimo para confirmar. El título puede no existir: no es obligatorio (D17). */
export interface DeletableDream {
  id: string;
  title: string | null;
}

/**
 * Confirmación del borrado. El cuerpo dice lo que se lleva por delante —el
 * sueño, su interpretación **y sus audios**—: es lo último que se lee antes de
 * pulsar, y aquí no hay copia de seguridad que valga.
 */
export function DeleteDreamDialog({
  dream,
  onClose,
  onDeleted,
}: {
  dream: DeletableDream | null;
  onClose: () => void;
  /** Desde la ficha hay que volver al listado; desde el listado, no. */
  onDeleted?: () => void;
}) {
  const { t } = useTranslation();
  const remove = useDeleteDream(api);
  const [error, setError] = useState<string | null>(null);

  return (
    <ConfirmDialog
      open={Boolean(dream)}
      onClose={onClose}
      destructive
      isPending={remove.isPending}
      error={error}
      title={t('dreams.deleteTitle', { title: dream?.title ?? t('dreams.untitled') })}
      description={t('dreams.deleteBody')}
      confirmLabel={t('common.delete')}
      onConfirm={() => {
        if (!dream) return;

        remove.mutate(dream.id, {
          onSuccess: () => {
            toast.success(t('dreams.removed'));
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
