import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ProgressRing } from '@/components/ui/progress-ring';
import { useTaskPalette } from './task-theme';
import type { ActivityItem } from '@/lib/tasks/filters';
import { listCardShadow } from '@/lib/ui/elevation';

export function TaskStatisticsHero({ items }: { items: ActivityItem[] }) {
    const { t } = useTranslation(),
        p = useTaskPalette();
    const done = items.filter((item) => item.status === 'completada').length;
    const rate = items.length ? done / items.length : 0;
    return (
        <View
            style={{
                borderRadius: 32,
                padding: 22,
                gap: 16,
                backgroundColor: p.primary,
                ...listCardShadow(p.primary, p.dark),
            }}
        >
            <Text className="font-sans-semibold text-[13px]" style={{ color: p.primaryForeground }}>
                {t('tasks.insights.todayProgress')}
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16, alignItems: 'center' }}>
                <View style={{ flex: 1, minWidth: 150, gap: 10 }}>
                    <Text
                        className="font-sans-bold text-[21px]"
                        style={{ color: p.primaryForeground }}
                    >
                        {t('tasks.insights.progressCount', { done, total: items.length })}
                    </Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
                        {(['task', 'habit'] as const).map((kind) => (
                            <View key={kind}>
                                <Text
                                    className="font-sans-bold text-[19px]"
                                    style={{ color: p.primaryForeground }}
                                >
                                    {
                                        items.filter(
                                            (item) =>
                                                (kind === 'task'
                                                    ? 'taskId' in item
                                                    : 'habitId' in item) &&
                                                item.status === 'completada',
                                        ).length
                                    }
                                </Text>
                                <Text
                                    className="font-sans-medium text-xs"
                                    style={{ color: p.primaryForeground }}
                                >
                                    {t(kind === 'task' ? 'tasks.tasksTab' : 'tasks.habitsTab')}
                                </Text>
                            </View>
                        ))}
                    </View>
                </View>
                <View
                    accessible
                    accessibilityLabel={`${Math.round(rate * 100)}% ${t('tasks.statusDone')}`}
                >
                    <ProgressRing
                        progress={rate}
                        size={92}
                        strokeWidth={9}
                        label={`${Math.round(rate * 100)}%`}
                        progressColor={p.primaryForeground}
                        trackColor="rgba(255,255,255,0.25)"
                        onScene
                    />
                </View>
            </View>
        </View>
    );
}
