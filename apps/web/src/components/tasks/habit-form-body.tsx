import { useCreateHabit, useUpdateHabit } from '@navis/api-client';
import {
  createHabitSchema,
  HABIT_REPEAT_FREQS,
  type Habit,
  type HabitRepeatFreq,
} from '@navis/shared';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';

import { TagPicker } from '@/components/tasks/tag-picker';
import { FormError } from '@/components/auth/form-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { api } from '@/lib/api';
import { formText, optionalText } from '@/lib/form';
import { toast } from '@/lib/toast';

const FREQ_KEY: Record<HabitRepeatFreq, string> = {
  ninguna: 'tasks.repeatNone',
  diaria: 'tasks.repeatDaily',
  semanal: 'tasks.repeatWeekly',
  mensual: 'tasks.repeatMonthly',
};

/** Los campos de un hábito (§5.3): repetición simple, sin intervalo ni fin. */
export function HabitFormBody({
  habit,
  defaultDate,
  onSaved,
}: {
  habit?: Habit;
  defaultDate: string;
  onSaved: () => void;
}) {
  const { t } = useTranslation();
  const create = useCreateHabit(api);
  const update = useUpdateHabit(api);

  const [allDay, setAllDay] = useState(!habit || habit.time === null);
  const [tagIds, setTagIds] = useState(habit?.tags.map((tag) => tag.id) ?? []);
  const [reminderEnabled, setReminderEnabled] = useState(habit?.reminder?.enabled ?? true);
  const [reminderAt, setReminderAt] = useState(toLocalInput(habit?.reminder?.remindAt ?? null));
  const [reminderTagIds, setReminderTagIds] = useState(
    habit?.reminder?.tags.map((tag) => tag.id) ?? [],
  );
  const [error, setError] = useState<string | null>(null);

  const titleRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    titleRef.current?.focus();
  }, []);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

    const parsed = createHabitSchema.safeParse({
      title: formText(form.get('title')),
      goal: optionalText(form.get('goal')),
      description: optionalText(form.get('description')),
      date: formText(form.get('date')),
      time: allDay ? null : optionalText(form.get('time')),
      repeatFreq: formText(form.get('repeatFreq')),
      tagIds,
      reminderEnabled,
      reminderAt: reminderEnabled ? reminderAt || undefined : undefined,
      reminderTagIds,
    });

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? t('errors.validation'));
      return;
    }

    setError(null);
    const save = habit
      ? update.mutateAsync({ id: habit.id, ...parsed.data })
      : create.mutateAsync(parsed.data);

    void save
      .then(() => {
        toast.success(habit ? t('tasks.habitUpdated') : t('tasks.habitCreated'));
        onSaved();
      })
      .catch(() => {
        setError(t('tasks.saveFailed'));
      });
  };

  return (
    <form onSubmit={submit} className="gap-4 min-w-0 flex flex-col" noValidate>
      <Input
        ref={titleRef}
        name="title"
        label={t('tasks.titleLabel')}
        defaultValue={habit?.title}
        required
        maxLength={200}
      />

      <Input
        name="goal"
        label={t('tasks.goal')}
        placeholder={t('tasks.goalPlaceholder')}
        defaultValue={habit?.goal ?? ''}
        maxLength={200}
      />

      <Textarea
        name="description"
        label={t('tasks.description')}
        defaultValue={habit?.description ?? ''}
        rows={3}
        maxLength={4000}
      />

      <div className="gap-3 grid grid-cols-2">
        <Input
          type="date"
          name="date"
          label={t('tasks.date')}
          defaultValue={habit?.date ?? defaultDate}
          required
        />

        <div className="gap-2 flex flex-col">
          <span className="text-sm font-medium">{t('tasks.time')}</span>
          <div className="gap-2 flex items-center">
            <Switch
              checked={!allDay}
              onChange={() => {
                setAllDay((previous) => !previous);
              }}
            />
            <span className="text-sm text-muted-foreground">{t('tasks.allDay')}</span>
          </div>
          {!allDay && (
            <Input
              type="time"
              name="time"
              defaultValue={habit?.time ?? '06:30'}
              aria-label={t('tasks.time')}
            />
          )}
        </div>
      </div>

      <Select
        name="repeatFreq"
        label={t('tasks.repeat')}
        defaultValue={habit?.repeatFreq ?? 'ninguna'}
      >
        {HABIT_REPEAT_FREQS.map((freq) => (
          <option key={freq} value={freq}>
            {t(FREQ_KEY[freq])}
          </option>
        ))}
      </Select>

      <TagPicker value={tagIds} onChange={setTagIds} />

      <div className="gap-3 p-3 flex flex-col rounded-lg border bg-muted/30">
        <div className="gap-2 flex items-center">
          <Switch
            checked={reminderEnabled}
            onChange={() => {
              setReminderEnabled((previous) => !previous);
            }}
          />
          <span className="text-sm font-medium">{t('tasks.reminder')}</span>
        </div>

        {reminderEnabled && (
          <>
            <Input
              type="datetime-local"
              label={t('tasks.reminderAt')}
              value={reminderAt}
              onChange={(event) => {
                setReminderAt(event.target.value);
              }}
            />
            <TagPicker value={reminderTagIds} onChange={setReminderTagIds} />
          </>
        )}
      </div>

      <FormError message={error} />

      <Button
        type="submit"
        size="lg"
        className="w-full"
        isLoading={create.isPending || update.isPending}
      >
        {t('common.save')}
      </Button>
    </form>
  );
}

function toLocalInput(iso: string | null): string {
  if (!iso) return '';
  const date = new Date(iso);
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${String(date.getFullYear())}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
