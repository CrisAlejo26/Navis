import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { TaskCardIcon } from './task-card-icon';
import { useTaskPalette, priorityKeys } from './task-theme';
import { formatDay } from '@/lib/format';
import { TaskLimitBadge } from './task-limit-badge';
import { TaskWorkflowBadge } from './task-workflow-badge';
import type { ActivityItem } from '@/lib/tasks/filters';
export function ActivityDetailHeader({ item }: { item: ActivityItem }) {
    const { t } = useTranslation(),
        p = useTaskPalette();
    return (
        <>
            <TaskCardIcon
                size={52}
                item={item}
                color={item.tags[0] ? p.accent(item.tags[0].accent) : p.primary}
            />
            <Text className="font-sans-bold text-[26px] text-foreground">{item.title}</Text>
            <View className="gap-2 flex-row flex-wrap">
                <Badge icon="calendar-outline" label={formatDay(item.date)} />
                <Badge icon="time-outline" label={item.time ?? t('tasks.allDay')} />
                <TaskLimitBadge item={item} />
                {'workflow' in item && item.workflow && (
                    <TaskWorkflowBadge workflow={item.workflow} />
                )}
                {'priority' in item && (
                    <Badge
                        label={t(priorityKeys[item.priority])}
                        tone={item.priority === 'alta' ? 'warning' : 'muted'}
                    />
                )}
            </View>
        </>
    );
}
