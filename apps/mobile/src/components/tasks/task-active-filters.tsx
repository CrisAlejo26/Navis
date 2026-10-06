import { ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Chip } from '@/components/ui/chip';
import { TaskChipsSkeleton } from './task-loading';
import { useTaskTags } from '@/hooks/use-tags';
import { formatDay } from '@/lib/format';
import type { TaskFilters } from '@/lib/tasks/filters';
import { statusKeys, priorityKeys } from './task-theme';
export function TaskActiveFilters({
    filters: f,
    onChange,
}: {
    filters: TaskFilters;
    onChange: (f: TaskFilters) => void;
}) {
    const { t } = useTranslation(),
        tags = useTaskTags();
    const chip = (key: string, label: string, patch: Partial<TaskFilters>) => (
        <Chip
            key={key}
            label={label}
            selected
            onRemove={() => onChange({ ...f, ...patch })}
            removeLabel={t('tasks.mobile.removeFilter', { label })}
        />
    );
    return (
        <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8 }}
        >
            {f.type !== 'both' &&
                chip('type', t(f.type === 'task' ? 'tasks.tasksTab' : 'tasks.habitsTab'), {
                    type: 'both',
                })}
            {(f.from || f.to) &&
                chip('date', `${formatDay(f.from ?? '')} – ${formatDay(f.to ?? '')}`, {
                    from: undefined,
                    to: undefined,
                })}
            {f.statuses?.map((status) =>
                chip(status, t(statusKeys[status]), {
                    statuses: f.statuses?.filter((one) => one !== status),
                }),
            )}
            {f.priorities?.map((priority) =>
                chip(priority, t(priorityKeys[priority]), {
                    priorities: f.priorities?.filter((one) => one !== priority),
                }),
            )}
            {tags.isPending && f.tag?.length ? (
                <TaskChipsSkeleton count={f.tag.length} />
            ) : (
                f.tag?.map((id) =>
                    chip(
                        id,
                        tags.data?.find((tag) => tag.id === id)?.name ?? t('tasks.filterTag'),
                        {
                            tag: f.tag?.filter((one) => one !== id),
                        },
                    ),
                )
            )}
            {f.reminder &&
                chip(
                    'reminder',
                    t(
                        f.reminder === 'with'
                            ? 'tasks.filterReminderWith'
                            : 'tasks.filterReminderWithout',
                    ),
                    { reminder: undefined },
                )}
            {f.recurring &&
                chip(
                    'repeat',
                    t(
                        f.recurring === 'with'
                            ? 'tasks.mobile.withRepeat'
                            : 'tasks.mobile.withoutRepeat',
                    ),
                    { recurring: undefined },
                )}
            {f.hideCompleted === false &&
                chip('done', t('tasks.showCompleted'), { hideCompleted: true })}
        </ScrollView>
    );
}
