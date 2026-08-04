import { useCreateCalendar, useUpdateCalendar } from '@navis/api-client';
import { createCalendarSchema, MINISTRIES, type Calendar } from '@navis/shared';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';

import { FormError } from '@/components/auth/form-error';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { api } from '@/lib/api';
import { MINISTRY_LABELS } from '@/lib/calendar/ministries';
import { formText } from '@/lib/form';
import { toast } from '@/lib/toast';

/**
 * Alta y renombrado de un calendario (RFC 0002 D15).
 *
 * El **ministerio** no es decoración: es lo que hace que en el calendario de
 * sonido salgan primero los de sonido (D16). Se puede dejar sin ninguno, y
 * entonces se propone a cualquiera.
 */
export function CalendarForm({
  open,
  onClose,
  calendar,
}: {
  open: boolean;
  onClose: () => void;
  /** Si viene, se renombra; si no, se crea. */
  calendar?: Calendar;
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const createCalendar = useCreateCalendar(api);
  const updateCalendar = useUpdateCalendar(api);
  const [error, setError] = useState<string | null>(null);

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const ministry = formText(form.get('ministry'));

    const parsed = createCalendarSchema.safeParse({
      name: formText(form.get('name')),
      ministry: ministry || null,
    });

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? t('errors.validation'));
      return;
    }

    setError(null);

    if (calendar) {
      updateCalendar.mutate(
        { id: calendar.id, ...parsed.data },
        {
          onSuccess: onClose,
          onError: () => {
            setError(t('calendar.saveFailed'));
          },
        },
      );
      return;
    }

    createCalendar.mutate(parsed.data, {
      onSuccess: (creado) => {
        toast.success(t('calendar.calendarCreated', { name: creado.name }));
        onClose();
        void navigate(`/calendar/${creado.slug}`);
      },
      onError: () => {
        setError(t('calendar.saveFailed'));
      },
    });
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={calendar ? t('calendar.renameCalendar') : t('calendar.addCalendar')}
    >
      <form onSubmit={submit} className="gap-4 flex flex-col" noValidate>
        <Input name="name" label={t('calendar.calendarName')} defaultValue={calendar?.name} />

        <Select
          name="ministry"
          label={t('calendar.ministry')}
          defaultValue={calendar?.ministry ?? ''}
        >
          <option value="">{t('calendar.ministryNone')}</option>
          {MINISTRIES.map((ministry) => (
            <option key={ministry} value={ministry}>
              {t(MINISTRY_LABELS[ministry])}
            </option>
          ))}
        </Select>

        <FormError message={error} />

        <Button
          type="submit"
          size="lg"
          className="w-full"
          isLoading={createCalendar.isPending || updateCalendar.isPending}
        >
          {calendar ? t('common.save') : t('calendar.addCalendar')}
        </Button>
      </form>
    </Dialog>
  );
}
