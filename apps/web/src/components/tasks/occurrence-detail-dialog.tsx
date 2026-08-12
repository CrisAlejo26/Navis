import {
  useDeleteHabit,
  useDeleteTask,
  useSetHabitOccurrence,
  useSetTaskOccurrence,
} from '@navis/api-client';
import type { HabitOccurrence, TaskOccurrence } from '@navis/shared';
import { Bell, Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { HabitForm } from '@/components/tasks/habit-form';
import { TagChip } from '@/components/tasks/tag-chip';
import { TaskForm } from '@/components/tasks/task-form';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Dialog } from '@/components/ui/dialog';
import { api } from '@/lib/api';
import { PRIORITY_ACCENT, PRIORITY_LABEL_KEY } from '@/lib/tasks/task-format';
import { toast } from '@/lib/toast';

type Occurrence = { kind: 'task'; item: TaskOccurrence } | { kind: 'habit'; item: HabitOccurrence };

/** El detalle de una tarea o un hábito de un día (RFC 0018 §9.6). */
export function OccurrenceDetailDialog({
  occurrence,
  onClose,
}: {
  occurrence: Occurrence;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const { item } = occurrence;

  const setTaskStatus = useSetTaskOccurrence(api);
  const setHabitStatus = useSetHabitOccurrence(api);
  const deleteTask = useDeleteTask(api);
  const deleteHabit = useDeleteHabit(api);

  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const id = occurrence.kind === 'task' ? occurrence.item.taskId : occurrence.item.habitId;
  const completed = item.status === 'completada';
  const isPending = occurrence.kind === 'task' ? setTaskStatus.isPending : setHabitStatus.isPending;

  const toggle = () => {
    const status = completed ? 'pendiente' : 'completada';
    const promise =
      occurrence.kind === 'task'
        ? setTaskStatus.mutateAsync({ taskId: occurrence.item.taskId, date: item.date, status })
        : setHabitStatus.mutateAsync({ habitId: occurrence.item.habitId, date: item.date, status });

    void promise.then(() => {
      toast.success(completed ? t('tasks.reopen') : t('tasks.complete'));
    });
  };

  const remove = () => {
    const promise =
      occurrence.kind === 'task' ? deleteTask.mutateAsync(id) : deleteHabit.mutateAsync(id);
    void promise.then(() => {
      toast.success(occurrence.kind === 'task' ? t('tasks.removed') : t('tasks.habitRemoved'));
      setDeleting(false);
      onClose();
    });
  };

  return (
    <>
      <Dialog open onClose={onClose} title={item.title} width="min(30rem, calc(100vw - 2rem))">
        <div className="gap-4 flex flex-col">
          {item.description && (
            <p className="text-sm leading-relaxed text-muted-foreground">{item.description}</p>
          )}

          <dl className="gap-x-4 gap-y-2 text-sm grid grid-cols-[auto_1fr]">
            <dt className="text-muted-foreground">{t('tasks.date')}</dt>
            <dd>
              {item.date}
              {item.time ? ` · ${item.time}` : ''}
            </dd>

            {occurrence.kind === 'task' && (
              <>
                <dt className="text-muted-foreground">{t('tasks.priority')}</dt>
                <dd
                  style={{ color: `var(--color-${PRIORITY_ACCENT[occurrence.item.priority]})` }}
                  className="font-medium"
                >
                  {t(PRIORITY_LABEL_KEY[occurrence.item.priority])}
                </dd>
              </>
            )}

            {occurrence.kind === 'habit' && occurrence.item.goal && (
              <>
                <dt className="text-muted-foreground">{t('tasks.goal')}</dt>
                <dd>{occurrence.item.goal}</dd>
              </>
            )}

            <dt className="text-muted-foreground">{t('tasks.status')}</dt>
            <dd>{completed ? t('tasks.statusDone') : t('tasks.statusPending')}</dd>

            {item.reminder?.enabled && (
              <>
                <dt className="text-muted-foreground">{t('tasks.reminder')}</dt>
                <dd className="gap-1.5 flex items-center">
                  <Bell size={13} aria-hidden />
                  {new Date(item.reminder.remindAt).toLocaleString()}
                </dd>
              </>
            )}
          </dl>

          {item.tags.length > 0 && (
            <div className="gap-1.5 flex flex-wrap">
              {item.tags.map((tag) => (
                <TagChip key={tag.id} tag={tag} />
              ))}
            </div>
          )}

          <div className="gap-2 flex">
            <Button
              variant={completed ? 'secondary' : 'primary'}
              onClick={toggle}
              isLoading={isPending}
              className="flex-1"
            >
              {completed ? t('tasks.reopen') : t('tasks.complete')}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label={t('tasks.edit')}
              onClick={() => {
                setEditing(true);
              }}
            >
              <Pencil size={16} aria-hidden />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label={t('common.delete')}
              onClick={() => {
                setDeleting(true);
              }}
            >
              <Trash2 size={16} aria-hidden />
            </Button>
          </div>
        </div>
      </Dialog>

      {occurrence.kind === 'task' ? (
        <TaskForm
          open={editing}
          onClose={() => {
            setEditing(false);
          }}
          taskId={occurrence.item.taskId}
          defaultDate={item.date}
        />
      ) : (
        <HabitForm
          open={editing}
          onClose={() => {
            setEditing(false);
          }}
          habitId={occurrence.item.habitId}
          defaultDate={item.date}
        />
      )}

      {deleting && (
        <ConfirmDialog
          open
          destructive
          title={t('tasks.deleteTitle', { title: item.title })}
          description={t('tasks.deleteConfirm')}
          confirmLabel={t('common.delete')}
          isPending={deleteTask.isPending || deleteHabit.isPending}
          onClose={() => {
            setDeleting(false);
          }}
          onConfirm={remove}
        />
      )}
    </>
  );
}
