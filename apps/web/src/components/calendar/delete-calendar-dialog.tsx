import { useDeleteCalendar } from '@navis/api-client';
import type { Calendar } from '@navis/shared';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { api } from '@/lib/api';
import { toast } from '@/lib/toast';

/**
 * Baja de un calendario. Se lleva por delante sus reuniones fijas y sus
 * programaciones, así que el aviso lo dice con todas las letras.
 *
 * Sin navegar por su cuenta: quien lo abre desde sus propios ajustes pasa
 * `onDeleted` para volver al primer calendario que quede; desde la barra
 * lateral no hace falta moverse de donde se esté.
 */
export function DeleteCalendarDialog({
  calendar,
  onClose,
  onDeleted,
}: {
  calendar: Calendar | null;
  onClose: () => void;
  onDeleted?: () => void;
}) {
  const { t } = useTranslation();
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
        onDeleted?.();
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
