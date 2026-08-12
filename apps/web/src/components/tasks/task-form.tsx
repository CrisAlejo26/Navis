import { useTask } from '@navis/api-client';
import { useTranslation } from 'react-i18next';

import { TaskFormBody } from '@/components/tasks/task-form-body';
import { Dialog } from '@/components/ui/dialog';
import { FormSkeleton } from '@/components/ui/form-skeleton';
import { api } from '@/lib/api';

/** Crear o editar una tarea (RFC 0018 §9.6). Al editar recibe el identificador y pide la plantilla entera. */
export function TaskForm({
  open,
  onClose,
  taskId,
  defaultDate,
}: {
  open: boolean;
  onClose: () => void;
  taskId?: string;
  defaultDate: string;
}) {
  const { t } = useTranslation();
  const { data: task } = useTask(api, taskId ?? '', open && Boolean(taskId));

  return (
    <Dialog
      open={open}
      onClose={onClose}
      width="min(34rem, calc(100vw - 2rem))"
      title={taskId ? t('tasks.edit') : t('tasks.add')}
    >
      {taskId && !task ? (
        <FormSkeleton fields={5} />
      ) : (
        <TaskFormBody
          key={task?.id ?? 'new'}
          task={task}
          defaultDate={defaultDate}
          onSaved={onClose}
        />
      )}
    </Dialog>
  );
}
