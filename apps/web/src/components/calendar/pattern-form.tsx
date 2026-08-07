import { useCreatePattern, useUpdatePattern } from '@navis/api-client';
import { createPatternSchema, type Congregation, type MeetingPattern } from '@navis/shared';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { FormError } from '@/components/auth/form-error';
import { PhaseFields } from '@/components/calendar/phase-fields';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { api } from '@/lib/api';
import { weekdayHeadings } from '@/lib/calendar/labels';
import { formText } from '@/lib/form';
import { toast } from '@/lib/toast';

/**
 * Una reunión fija: «los viernes en Elda a las 20:00, con estas fases».
 *
 * De aquí sale todo lo demás: el mes se rellena solo con estas propuestas y no
 * se crea una fila hasta que alguien asigna a alguien (D3).
 */
export function PatternForm({
  open,
  onClose,
  congregations,
  calendarId,
  pattern,
}: {
  open: boolean;
  calendarId: string;
  onClose: () => void;
  congregations: readonly Congregation[];
  /** Si viene, se edita; si no, se crea. */
  pattern?: MeetingPattern;
}) {
  const { t } = useTranslation();
  const createPattern = useCreatePattern(api, calendarId);
  const updatePattern = useUpdatePattern(api, calendarId);
  const [phases, setPhases] = useState(pattern?.phases.map((phase) => phase.name) ?? ['', '']);
  const [error, setError] = useState<string | null>(null);

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

    const parsed = createPatternSchema.safeParse({
      congregationId: formText(form.get('congregationId')),
      name: formText(form.get('name')),
      weekday: Number(formText(form.get('weekday'))),
      startTime: formText(form.get('startTime')),
      phases: phases.map((name) => ({ name: name.trim() })).filter((phase) => phase.name),
    });

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? t('errors.validation'));
      return;
    }

    setError(null);
    const done = {
      onSuccess: onClose,
      onError: () => {
        setError(t('calendar.saveFailed'));
      },
    };

    if (pattern) updatePattern.mutate({ id: pattern.id, ...parsed.data }, done);
    else createPattern.mutate(parsed.data, done);
  };

  return (
    <Dialog open={open} onClose={onClose} title={t('calendar.addPattern')}>
      <form onSubmit={submit} className="gap-4 flex flex-col" noValidate>
        <Select
          name="congregationId"
          label={t('calendar.congregation')}
          defaultValue={pattern?.congregationId ?? congregations[0]?.id}
          required
        >
          {congregations.map((congregation) => (
            <option key={congregation.id} value={congregation.id}>
              {congregation.name}
            </option>
          ))}
        </Select>

        <Input
          name="name"
          label={t('calendar.meetingName')}
          defaultValue={pattern?.name}
          required
        />

        <div className="gap-3 grid grid-cols-2">
          <Select
            name="weekday"
            label={t('calendar.patternWeekday')}
            defaultValue={String(pattern?.weekday ?? 0)}
            required
          >
            {weekdayHeadings().map((heading, index) => (
              <option key={heading.key} value={String((index + 1) % 7)}>
                {heading.label}
              </option>
            ))}
          </Select>

          <Input
            name="startTime"
            type="time"
            label={t('calendar.startTime')}
            defaultValue={pattern?.startTime ?? '20:00'}
            required
          />
        </div>

        <PhaseFields phases={phases} onChange={setPhases} />
        <FormError message={error} />

        <Button
          type="submit"
          size="lg"
          className="w-full"
          isLoading={createPattern.isPending || updatePattern.isPending}
        >
          {t('common.save')}
        </Button>
      </form>
    </Dialog>
  );
}
