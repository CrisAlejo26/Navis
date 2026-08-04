import { useDeleteCalendar } from '@navis/api-client';
import type { Calendar } from '@navis/shared';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';

import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { api } from '@/lib/api';
import { toast } from '@/lib/toast';

/**
 * Baja de un calendario. Se lleva por delante sus reuniones fijas y sus
 * programaciones, así que el aviso lo dice con todas las letras.
 */
export function DeleteCalendarDialog({
  calendar,
  onClose,
}: {
  calendar: Calendar | null;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const remove = useDeleteCalendar(api);
  const [error, setError] = useState<string | null>(null);

  const close = () => {
    setError(null);
    onClose();
  };

  const confirm = () => {
    if (!calendar) return;

    remove.mutate(calendar.id, {
      onSuccess: () => {
        close();
        toast.success(t('calendar.calendarDeleted', { name: calendar.name }));
        void navigate('/calendar');
      },
      onError: () => {
        setError(t('calendar.lastCalendar'));
      },
    });
  };

  return (
    <ConfirmDialog
      open={calendar !== null}
      onClose={close}
      onConfirm={confirm}
      title={t('calendar.deleteTitle', { name: calendar?.name ?? '' })}
      description={t('calendar.deleteCalendarBody')}
      confirmLabel={t('common.delete')}
      destructive
      isPending={remove.isPending}
      error={error}
    />
  );
}
