import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { hexAlpha, readableAccent } from '@/lib/color';
import { activityKind, type ActivityItem } from '@/lib/tasks/filters';
import { statusKeys, priorityKeys, useTaskPalette } from './task-theme';
export function TaskCardChips({ item }: { item: ActivityItem }) {
    const p = useTaskPalette(),
        { t } = useTranslation(),
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
            {item.tags.map((label) => (
                <View
                    key={label.id}
                    style={{
                        borderRadius: 20,
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        backgroundColor: hexAlpha(label.accent, 0.12),
                    }}
                >
                    <Text
                        className="font-sans-medium text-xs"
                        style={{ color: readableAccent(label.accent, p.card, p.foreground) }}
                    >
                        {label.name}
                    </Text>
                </View>
            ))}
            {item.isRecurring && <Badge label={t('tasks.repeat')} icon="repeat-outline" />}
            {item.reminder?.enabled && (
                <Badge label={t('tasks.reminder')} icon="notifications-outline" />
            )}
        </View>
    );
}
