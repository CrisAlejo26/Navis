import { useDeleteGift } from '@navis/api-client';
import type { Gift } from '@navis/shared';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { api } from '@/lib/api';
import { toast } from '@/lib/toast';

/** Borrar un don propio de la iglesia. Los de serie no llegan aquí (D5). */
export function DeleteGiftDialog({ gift, onClose }: { gift: Gift | null; onClose: () => void }) {
  const { t } = useTranslation();
  const remove = useDeleteGift(api);
  const [error, setError] = useState<string | null>(null);

  return (
    <ConfirmDialog
      open={Boolean(gift)}
      onClose={onClose}
      destructive
      isPending={remove.isPending}
      error={error}
      title={t('gifts.deleteTitle', { name: gift?.name ?? '' })}
      description={t('gifts.deleteBody')}
      confirmLabel={t('common.delete')}
      onConfirm={() => {
        if (!gift) return;

        remove.mutate(gift.id, {
          onSuccess: () => {
            toast.success(t('gifts.removed'));
            onClose();
          },
          onError: () => {
            setError(t('gifts.systemLocked'));
          },
        });
      }}
    />
  );
}
