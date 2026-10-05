import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { activityKind, type ActivityItem } from '@/lib/tasks/filters';
import { statusKeys, priorityKeys } from './task-theme';
import { TaskTagBadges } from './task-tag-badges';
export function TaskCardChips({ item }: { item: ActivityItem }) {
    const { t } = useTranslation(),
        done = item.status === 'completada',
        kind = activityKind(item);
    return (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginTop: 2 }}>
            <Badge
                label={t(statusKeys[item.status])}
                tone={done ? 'success' : item.status === 'en_progreso' ? 'primary' : 'muted'}
            />
            {kind === 'habit' && <Badge label={t('tasks.habitsTab')} icon="leaf-outline" />}
            {'priority' in item && item.priority === 'alta' && (
                <Badge label={t(priorityKeys[item.priority])} tone="warning" />
            )}
            <TaskTagBadges tags={item.tags} />
            {item.isRecurring && <Badge label={t('tasks.repeat')} icon="repeat-outline" />}
            {item.reminder?.enabled && (
                <Badge label={t('tasks.reminder')} icon="notifications-outline" />
            )}
        </View>
    );
}
