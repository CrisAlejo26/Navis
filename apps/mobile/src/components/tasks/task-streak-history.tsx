import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { TaskStreakDay } from '@navis/shared';
import { formatDay } from '@/lib/format';
import { ActivityBlock } from './activity-block';
import { useTaskPalette } from './task-theme';

export function TaskStreakHistory({ days }: { days: TaskStreakDay[] }) {
    const { t } = useTranslation(),
        p = useTaskPalette();
    return (
        <ActivityBlock title={t('tasks.insights.history90')}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 5 }}>
                {days.map((day) => (
                    <View
                        key={day.date}
                        accessible
                        accessibilityLabel={`${formatDay(day.date)}: ${t(day.empty ? 'tasks.insights.noTasks' : day.completed ? 'tasks.mobile.dayComplete' : 'tasks.statusPending')}`}
                        style={{
                            width: 14,
                            height: 14,
                            borderRadius: 4,
                            borderWidth: day.empty ? 1 : 0,
                            borderColor: p.border,
                            backgroundColor: day.completed
                                ? p.warning
                                : day.empty
                                  ? p.card
                                  : p.muted,
                        }}
                    />
                ))}
            </View>
            <Text className="font-sans text-xs text-muted-foreground">
                {t('tasks.insights.historyHint')}
            </Text>
        </ActivityBlock>
    );
}
