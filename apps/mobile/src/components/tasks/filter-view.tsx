import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Select } from '@/components/ui/select';
import type { TaskFilters, TaskGroup } from '@/lib/tasks/filters';
import type { TaskSort } from '@navis/shared';
export function FilterView({
    draft: f,
    onChange,
}: {
    draft: TaskFilters;
    onChange: (f: TaskFilters) => void;
}) {
    const { t } = useTranslation();
    const sorts = {
        nearest: 'tasks.sortNearest',
        farthest: 'tasks.sortFarthest',
        priority: 'tasks.sortPriority',
        recent: 'tasks.sortRecent',
        alphabetical: 'tasks.sortAlphabetical',
    } as const;
    const groups = {
        date: 'tasks.groupDate',
        status: 'tasks.groupStatus',
        priority: 'tasks.groupPriority',
        tag: 'tasks.groupTag',
        none: 'tasks.groupNone',
    } as const;
    return (
        <View className="gap-4">
            <Select
                label={t('tasks.sortBy')}
                placeholder={t('tasks.sortNearest')}
                value={f.sort ?? 'nearest'}
                options={(Object.keys(sorts) as TaskSort[]).map((value) => ({
                    value,
                    label: t(sorts[value]),
                }))}
                onChange={(sort) => onChange({ ...f, sort })}
            />
            <Select
                label={t('tasks.groupBy')}
                placeholder={t('tasks.groupDate')}
                value={f.group}
                options={(Object.keys(groups) as TaskGroup[]).map((value) => ({
                    value,
                    label: t(groups[value]),
                }))}
                onChange={(group) => onChange({ ...f, group })}
            />
        </View>
    );
}
