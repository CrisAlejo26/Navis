import { Text, View, useWindowDimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Icon } from '@/components/ui/icon';
import { formatNumber } from '@/lib/format';
import type { TaskStatisticsState } from './use-task-statistics';

export function TaskStatisticsMetrics({ state: s }: { state: TaskStatisticsState }) {
    const { t } = useTranslation();
    const { fontScale } = useWindowDimensions();
    const metrics = [
        {
            value: s.completed,
            label: 'tasks.insights.finished',
            icon: 'checkmark-done-outline',
            tone: 'success',
        },
        {
            value: s.total,
            label: 'tasks.insights.scheduled',
            icon: 'calendar-outline',
            tone: 'primary',
        },
        {
            value: s.query.data?.tasks.longestStreak ?? 0,
            label: 'tasks.insights.bestTaskStreak',
            icon: 'star-outline',
            tone: 'warning',
        },
        {
            value: s.todayQuery.data?.filter((item) => 'habitId' in item).length ?? 0,
            label: 'tasks.insights.habitsToday',
            icon: 'leaf-outline',
            tone: 'primary',
        },
    ] as const;
    return (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
            {metrics.map((metric) => (
                <View
                    key={metric.label}
                    className="border border-border bg-card"
                    style={{
                        flexGrow: 1,
                        flexBasis: '45%',
                        minWidth: 130 * fontScale,
                        borderRadius: 26,
                        padding: 16,
                        gap: 8,
                    }}
                >
                    <Icon name={metric.icon} tone={metric.tone} background="soft" shape="square" />
                    <Text className="font-sans-bold text-[26px] text-foreground">
                        {formatNumber(metric.value)}
                    </Text>
                    <Text className="font-sans text-[13px] text-muted-foreground">
                        {t(metric.label)}
                    </Text>
                </View>
            ))}
        </View>
    );
}
