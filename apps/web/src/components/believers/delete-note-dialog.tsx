import { useDeleteNote } from '@navis/api-client';
import type { BelieverNote } from '@navis/shared';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { api } from '@/lib/api';
import { toast } from '@/lib/toast';

/**
 * Borrar una nota. El cuerpo dice lo que **no** pasa: el don que anotara se le
 * queda, porque borrar el apunte de cuándo lo recibió no es dejar de tenerlo
 * (§6.3).
 */
export function DeleteNoteDialog({
  note,
  believerId,
  onClose,
}: {
  note: BelieverNote | null;
  believerId: string;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const remove = useDeleteNote(api, believerId);
  const [error, setError] = useState<string | null>(null);

  return (
    <ConfirmDialog
      open={Boolean(note)}
      onClose={onClose}
      destructive
      isPending={remove.isPending}
      error={error}
      title={t('notes.deleteTitle')}
      description={t('notes.deleteBody')}
      confirmLabel={t('common.delete')}
      onConfirm={() => {
        if (!note) return;

        remove.mutate(note.id, {
          onSuccess: () => {
            toast.success(t('notes.deleted'));
            onClose();
          },
          onError: () => {
            setError(t('errors.generic'));
          },
        });
      }}
    />
  );
}
