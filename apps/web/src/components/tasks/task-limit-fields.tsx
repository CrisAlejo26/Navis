import { useTranslation } from 'react-i18next';

import { Input } from '@/components/ui/input';

/**
 * El límite de una tarea (Fase 7a): «vence el» y el tiempo máximo mientras
 * está en progreso. Solo las tareas que no se repiten lo tienen, así que el
 * formulario no lo enseña en una serie.
 */
export function TaskLimitFields({
    dueDate,
    deadline,
    minDate,
    onDueDate,
    onDeadline,
}: {
    dueDate: string;
    deadline: string;
    minDate: string;
    onDueDate: (value: string) => void;
    onDeadline: (value: string) => void;
}) {
    const { t } = useTranslation();
    return (
        <fieldset className="gap-3 p-3 flex flex-col rounded-lg border bg-muted/30">
            <legend className="px-1 text-sm font-medium">{t('tasks.limitSection')}</legend>
            <Input
                type="date"
                label={t('tasks.dueDate')}
                value={dueDate}
                min={minDate}
                onChange={(event) => {
                    onDueDate(event.target.value);
                }}
            />
            <Input
                type="datetime-local"
                label={t('tasks.inProgressDeadline')}
                hint={t('tasks.inProgressDeadlineHint')}
                value={deadline}
                onChange={(event) => {
                    onDeadline(event.target.value);
                }}
            />
        </fieldset>
    );
}
