import { useCreateMeeting } from '@navis/api-client';
import { createMeetingSchema, type Congregation } from '@navis/shared';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { PhaseFields } from '@/components/calendar/phase-fields';
import { FormError } from '@/components/auth/form-error';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { api } from '@/lib/api';
import { longDay } from '@/lib/calendar/labels';
import { formText } from '@/lib/form';
import { toast } from '@/lib/toast';

/**
 * Una reunión suelta: la que no nace de ninguna reunión fija. Sirve para la
 * vigilia de este viernes y para programar una sede que ese día no tenía nada.
 */
export function AddMeetingDialog({
  date,
  congregations,
  congregationId,
  calendarId,
  onClose,
}: {
  date: string | null;
  calendarId: string;
  congregations: readonly Congregation[];
  congregationId: string;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const createMeeting = useCreateMeeting(api, calendarId);
  const [phases, setPhases] = useState(['', '']);
  const [error, setError] = useState<string | null>(null);

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!date) return;
    const form = new FormData(event.currentTarget);

    const parsed = createMeetingSchema.safeParse({
      congregationId: formText(form.get('congregationId')),
      date,
      startTime: formText(form.get('startTime')),
      name: formText(form.get('name')),
      phases: phases.map((name) => ({ name: name.trim() })).filter((phase) => phase.name),
    });

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? t('errors.validation'));
      return;
    }

    setError(null);
    createMeeting.mutate(parsed.data, {
      onSuccess: (creada) => {
        toast.success(t('calendar.meetingCreated', { name: creada.name }));
        onClose();
      },
      onError: () => {
        setError(t('calendar.saveFailed'));
      },
    });
  };

  return (
    <Dialog
      open={Boolean(date)}
      onClose={onClose}
      title={t('calendar.addMeeting')}
      description={date ? longDay(date) : undefined}
    >
      <form onSubmit={submit} className="gap-4 flex flex-col" noValidate>
        {congregations.length > 1 && (
          <Select
            name="congregationId"
            label={t('calendar.congregation')}
            defaultValue={congregationId}
            required
          >
            {congregations.map((congregation) => (
              <option key={congregation.id} value={congregation.id}>
                {congregation.name}
              </option>
            ))}
          </Select>
        )}
        {congregations.length <= 1 && (
          <input type="hidden" name="congregationId" value={congregationId} />
        )}

        <div className="gap-3 grid grid-cols-2">
          <Input name="name" label={t('calendar.meetingName')} required />
          <Input
            name="startTime"
            type="time"
            label={t('calendar.startTime')}
            defaultValue="20:00"
            required
          />
        </div>

        <PhaseFields phases={phases} onChange={setPhases} />

        <FormError message={error} />

        <Button type="submit" size="lg" className="w-full" isLoading={createMeeting.isPending}>
          {t('calendar.addMeeting')}
        </Button>
      </form>
    </Dialog>
  );
}
