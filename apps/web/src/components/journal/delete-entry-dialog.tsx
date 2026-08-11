import { useDeleteEntry } from '@navis/api-client';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { api } from '@/lib/api';
import { toast } from '@/lib/toast';

/** Lo mínimo para confirmar: el título es lo que identifica a una entrada (D3). */
export interface DeletableEntry {
  id: string;
  title: string;
}

/** Confirmación del borrado: dice que se lleva la entrada y sus audios. */
export function DeleteEntryDialog({
  entry,
  onClose,
  onDeleted,
}: {
  entry: DeletableEntry | null;
  onClose: () => void;
  /** Desde la ficha hay que volver al listado; desde el listado, no. */
  onDeleted?: () => void;
}) {
  const { t } = useTranslation();
  const remove = useDeleteEntry(api);
  const [error, setError] = useState<string | null>(null);

  return (
    <ConfirmDialog
      open={Boolean(entry)}
      onClose={onClose}
      destructive
      isPending={remove.isPending}
      error={error}
      title={t('journal.deleteTitle', { title: entry?.title ?? '' })}
      description={t('journal.deleteBody')}
      confirmLabel={t('common.delete')}
      onConfirm={() => {
        if (!entry) return;

        remove.mutate(entry.id, {
          onSuccess: () => {
            toast.success(t('journal.removed'));
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
