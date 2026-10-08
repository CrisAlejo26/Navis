import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Chip } from '@/components/ui/chip';
import { FilterFlags } from './filter-flags';
import { useTaskTags } from '@/hooks/use-tags';
import { useWorkflows } from '@/hooks/use-workflows';
import { TaskChipsSkeleton } from './task-loading';
import type { TaskFilters } from '@/lib/tasks/filters';
import { statusKeys, priorityKeys } from './task-theme';
export function FilterMeta({
    draft: f,
    onChange,
}: {
    draft: TaskFilters;
    onChange: (f: TaskFilters) => void;
}) {
    const { t } = useTranslation(),
        tags = useTaskTags(),
        workflows = useWorkflows();
    const toggle = <T extends string>(items: readonly T[] | undefined, value: T) =>
        items?.includes(value) ? items.filter((one) => one !== value) : [...(items ?? []), value];
    return (
        <View className="gap-4">
            <Text className="font-sans-semibold text-base text-foreground">
                {t('tasks.status')}
            </Text>
            <View className="gap-2 flex-row flex-wrap">
                {(['pendiente', 'en_progreso', 'completada'] as const).map((status) => (
                    <Chip
                        key={status}
                        label={t(statusKeys[status])}
                        selected={f.statuses?.includes(status)}
                        onPress={() =>
                            onChange({
                                ...f,
                                statuses: toggle(f.statuses, status),
                                hideCompleted: status === 'completada' ? false : f.hideCompleted,
                            })
                        }
                    />
                ))}
            </View>
            <Text className="font-sans-semibold text-base text-foreground">
                {t('tasks.priority')}
            </Text>
            <View className="gap-2 flex-row flex-wrap">
                {(['alta', 'media', 'baja'] as const).map((priority) => (
                    <Chip
                        key={priority}
                        label={t(priorityKeys[priority])}
                        selected={f.priorities?.includes(priority)}
                        onPress={() =>
                            onChange({ ...f, priorities: toggle(f.priorities, priority) })
                        }
                    />
                ))}
            </View>
            <Text className="font-sans-semibold text-base text-foreground">{t('tasks.tags')}</Text>
            <View className="gap-2 flex-row flex-wrap">
                {tags.data?.map((tag) => (
                    <Chip
                        key={tag.id}
                        label={tag.name}
                        color={tag.accent}
                        selected={f.tag?.includes(tag.id)}
                        onPress={() => onChange({ ...f, tag: toggle(f.tag, tag.id) })}
                    />
                ))}
            </View>
            {tags.isPending && <TaskChipsSkeleton />}
            {tags.isError && (
                <Text accessibilityRole="alert" className="font-sans text-destructive">
                    {t('errors.generic')}
                </Text>
            )}
            {!tags.isPending && !tags.isError && !tags.data?.length && (
                <Text className="font-sans text-muted-foreground">{t('tasks.mobile.noTags')}</Text>
            )}
            {!!workflows.data?.length && (
                <>
                    <Text className="font-sans-semibold text-base text-foreground">
                        {t('tasks.workflow')}
                    </Text>
                    <View className="gap-2 flex-row flex-wrap">
                        {workflows.data.map((workflow) => (
                            <Chip
                                key={workflow.id}
                                label={workflow.name}
                                color={workflow.accent}
                                selected={f.workflowId === workflow.id}
                                onPress={() =>
                                    onChange({
                                        ...f,
                                        workflowId:
                                            f.workflowId === workflow.id ? undefined : workflow.id,
                                    })
                                }
                            />
                        ))}
                    </View>
                </>
            )}
            <FilterFlags draft={f} onChange={onChange} />
        </View>
    );
}
