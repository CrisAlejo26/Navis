import { useHabit } from '@navis/api-client';
import { useTranslation } from 'react-i18next';

import { HabitFormBody } from '@/components/tasks/habit-form-body';
import { Dialog } from '@/components/ui/dialog';
import { FormSkeleton } from '@/components/ui/form-skeleton';
import { api } from '@/lib/api';

/** Crear o editar un hábito (RFC 0018 §9.6). */
export function HabitForm({
  open,
  onClose,
  habitId,
  defaultDate,
}: {
  open: boolean;
  onClose: () => void;
  habitId?: string;
  defaultDate: string;
}) {
  const { t } = useTranslation();
  const { data: habit } = useHabit(api, habitId ?? '', open && Boolean(habitId));

  return (
    <Dialog
      open={open}
      onClose={onClose}
      width="min(34rem, calc(100vw - 2rem))"
      title={habitId ? t('tasks.edit') : t('tasks.addHabit')}
    >
      {habitId && !habit ? (
        <FormSkeleton fields={5} />
      ) : (
        <HabitFormBody
          key={habit?.id ?? 'new'}
          habit={habit}
          defaultDate={defaultDate}
          onSaved={onClose}
        />
      )}
    </Dialog>
  );
}
