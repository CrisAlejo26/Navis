import { useDeleteFulfillment } from '@navis/api-client';
import type { ProphecyFulfillment } from '@navis/shared';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { api } from '@/lib/api';
import { toast } from '@/lib/toast';

/**
 * Confirmación de quitar un cumplimiento parcial.
 *
 * El cuerpo aclara lo que **no** pasa: la palabra se queda. Borrarlo puede
 * devolver la profecía a «en espera» si era el único que tenía, y eso es
 * correcto — el estado se deriva de lo que hay (D3).
 */
export function DeleteFulfillmentDialog({
  prophecyId,
  fulfillment,
  onClose,
}: {
  prophecyId: string;
  fulfillment: ProphecyFulfillment | null;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const remove = useDeleteFulfillment(api);
  const [error, setError] = useState<string | null>(null);

  return (
    <ConfirmDialog
      open={Boolean(fulfillment)}
      onClose={onClose}
      destructive
      isPending={remove.isPending}
      error={error}
      title={t('prophecies.deleteFulfillmentTitle')}
      description={t('prophecies.deleteFulfillmentBody')}
      confirmLabel={t('common.delete')}
      onConfirm={() => {
        if (!fulfillment) return;

        remove.mutate(
          { prophecyId, id: fulfillment.id },
          {
            onSuccess: () => {
              toast.success(t('prophecies.fulfillmentRemoved'));
              onClose();
            },
            onError: () => {
              setError(t('errors.generic'));
            },
          },
        );
      }}
    />
  );
}
