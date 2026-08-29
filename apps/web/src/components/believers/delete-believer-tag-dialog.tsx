import { useDeleteBelieverTag } from '@navis/api-client';
import type { BelieverTag } from '@navis/shared';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { api } from '@/lib/api';
import { toast } from '@/lib/toast';

/** Borrar una etiqueta del catálogo. No hay de serie, así que todas llegan aquí. */
export function DeleteBelieverTagDialog({
  tag,
  onClose,
}: {
  tag: BelieverTag | null;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const remove = useDeleteBelieverTag(api);
  const [error, setError] = useState<string | null>(null);

  return (
    <ConfirmDialog
      open={Boolean(tag)}
      onClose={onClose}
      destructive
      isPending={remove.isPending}
      error={error}
      title={t('believerTags.deleteTitle', { name: tag?.name ?? '' })}
      description={t('believerTags.deleteBody')}
      confirmLabel={t('common.delete')}
      onConfirm={() => {
        if (!tag) return;

        remove.mutate(tag.id, {
          onSuccess: () => {
            toast.success(t('believerTags.removed'));
            onClose();
          },
          onError: () => {
            setError(t('believerTags.systemLocked'));
          },
        });
      }}
    />
  );
}
