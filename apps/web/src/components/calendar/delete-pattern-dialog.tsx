import { useDeletePattern } from '@navis/api-client';
import type { MeetingPattern } from '@navis/shared';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { api } from '@/lib/api';
import { toast } from '@/lib/toast';

/**
 * Baja de una reunión fija. Lo que ya se programó a partir de ella **se
 * queda**: eso son decisiones tomadas (D7), y el aviso lo dice para que nadie
 * se lo imagine al revés.
 */
export function DeletePatternDialog({
  pattern,
  calendarId,
  onClose,
}: {
  pattern: MeetingPattern | null;
  calendarId: string;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const remove = useDeletePattern(api, calendarId);
  const [error, setError] = useState<string | null>(null);

  const close = () => {
    setError(null);
    onClose();
  };

  const confirm = () => {
    if (!pattern) return;

    remove.mutate(pattern.id, {
      onSuccess: () => {
        close();
        toast.success(t('calendar.patternDeleted', { name: pattern.name }));
      },
      onError: () => {
        setError(t('errors.generic'));
      },
    });
  };

  return (
    <ConfirmDialog
      open={pattern !== null}
      onClose={close}
      onConfirm={confirm}
      title={t('calendar.deleteTitle', { name: pattern?.name ?? '' })}
      description={t('calendar.deletePatternBody')}
      confirmLabel={t('common.delete')}
      destructive
      isPending={remove.isPending}
      error={error}
    />
  );
}
