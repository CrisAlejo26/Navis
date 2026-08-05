import { useDeleteMinistry } from '@navis/api-client';
import type { MinistryCatalog } from '@navis/shared';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { api } from '@/lib/api';
import { toast } from '@/lib/toast';

/** Borrar un don propio de la iglesia. Los de serie no llegan aquí (D5). */
export function DeleteMinistryDialog({
  ministry,
  onClose,
}: {
  ministry: MinistryCatalog | null;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const remove = useDeleteMinistry(api);
  const [error, setError] = useState<string | null>(null);

  return (
    <ConfirmDialog
      open={Boolean(ministry)}
      onClose={onClose}
      destructive
      isPending={remove.isPending}
      error={error}
      title={t('ministries.deleteTitle', { name: ministry?.name ?? '' })}
      description={t('ministries.deleteBody')}
      confirmLabel={t('common.delete')}
      onConfirm={() => {
        if (!ministry) return;

        remove.mutate(ministry.id, {
          onSuccess: () => {
            toast.success(t('ministries.removed'));
            onClose();
          },
          onError: () => {
            setError(t('ministries.systemLocked'));
          },
        });
      }}
    />
  );
}
