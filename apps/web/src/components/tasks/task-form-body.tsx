import { useCreateTask, useUpdateTask } from '@navis/api-client';
import { createTaskSchema, DEFAULT_TASK_PRIORITY, TASK_PRIORITIES, type Task } from '@navis/shared';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';

import { RepeatFields, type RepeatDraft } from '@/components/tasks/repeat-fields';
import { TagPicker } from '@/components/tasks/tag-picker';
import { FormError } from '@/components/auth/form-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { api } from '@/lib/api';
import { formText, optionalText } from '@/lib/form';
import { PRIORITY_LABEL_KEY } from '@/lib/tasks/task-format';
import { toast } from '@/lib/toast';

const DEFAULT_REPEAT: RepeatDraft = {
  freq: 'diaria',
  interval: 1,
  endType: 'nunca',
  endDate: '',
  endCount: 10,
};

/**
 * Los campos de una tarea, ya con la plantilla cargada (si se edita). Nace
 * con `key` desde el padre para que su estado salga correcto de una vez
 * (mismo criterio que `EntryFormBody`, `ProphecyFormBody`).
 */
export function TaskFormBody({
  task,
  defaultDate,
  onSaved,
}: {
  task?: Task;
  defaultDate: string;
  onSaved: () => void;
}) {
  const { t } = useTranslation();
  const create = useCreateTask(api);
  const update = useUpdateTask(api);

  const [allDay, setAllDay] = useState(!task || task.time === null);
  const [isRecurring, setIsRecurring] = useState(task?.isRecurring ?? false);
  const [repeat, setRepeat] = useState<RepeatDraft>(
    task?.isRecurring
      ? {
          freq: task.repeatFreq ?? 'diaria',
          interval: task.repeatInterval,
          endType: task.repeatEndType ?? 'nunca',
          endDate: task.repeatEndDate ?? '',
          endCount: task.repeatEndCount ?? 10,
        }
      : DEFAULT_REPEAT,
  );
  const [tagIds, setTagIds] = useState(task?.tags.map((tag) => tag.id) ?? []);
  const [reminderEnabled, setReminderEnabled] = useState(task?.reminder?.enabled ?? true);
  const [reminderAt, setReminderAt] = useState(toLocalInput(task?.reminder?.remindAt ?? null));
  const [reminderTagIds, setReminderTagIds] = useState(
    task?.reminder?.tags.map((tag) => tag.id) ?? [],
  );
  const [error, setError] = useState<string | null>(null);

  const titleRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    titleRef.current?.focus();
  }, []);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

    const parsed = createTaskSchema.safeParse({
      title: formText(form.get('title')),
      description: optionalText(form.get('description')),
      date: formText(form.get('date')),
      time: allDay ? null : optionalText(form.get('time')),
      priority: formText(form.get('priority')),
      isRecurring,
      repeatFreq: isRecurring ? repeat.freq : undefined,
      repeatInterval: repeat.interval,
      repeatEndType: isRecurring ? repeat.endType : undefined,
      repeatEndDate: isRecurring && repeat.endType === 'fecha' ? repeat.endDate : undefined,
      repeatEndCount: isRecurring && repeat.endType === 'cantidad' ? repeat.endCount : undefined,
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
    const save = task
      ? update.mutateAsync({ id: task.id, ...parsed.data })
      : create.mutateAsync(parsed.data);

    void save
      .then(() => {
        toast.success(task ? t('tasks.updated') : t('tasks.created'));
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
        placeholder={t('tasks.titlePlaceholder')}
        defaultValue={task?.title}
        required
        maxLength={200}
      />

      <Textarea
        name="description"
        label={t('tasks.description')}
        defaultValue={task?.description ?? ''}
        rows={3}
        maxLength={4000}
      />

      <div className="gap-3 grid grid-cols-2">
        <Input
          type="date"
          name="date"
          label={t('tasks.date')}
          defaultValue={task?.date ?? defaultDate}
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
              defaultValue={task?.time ?? '09:00'}
              aria-label={t('tasks.time')}
            />
          )}
        </div>
      </div>

      <Select
        name="priority"
        label={t('tasks.priority')}
        defaultValue={task?.priority ?? DEFAULT_TASK_PRIORITY}
      >
        {TASK_PRIORITIES.map((priority) => (
          <option key={priority} value={priority}>
            {t(PRIORITY_LABEL_KEY[priority])}
          </option>
        ))}
      </Select>

      <div className="gap-2 flex items-center">
        <Switch
          checked={isRecurring}
          onChange={() => {
            setIsRecurring((previous) => !previous);
          }}
        />
        <span className="text-sm font-medium">
          {isRecurring ? t('tasks.repeat') : t('tasks.repeatNone')}
        </span>
      </div>

      {isRecurring && <RepeatFields value={repeat} onChange={setRepeat} />}

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
