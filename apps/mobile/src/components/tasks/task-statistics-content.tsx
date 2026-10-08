import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { BarChart } from '@/components/ui/bar-chart';
import { LineChart } from '@/components/ui/line-chart';
import { statisticsDayLabel } from './statistics-day-label';
import type { TaskStatisticsState } from './use-task-statistics';
import { TaskStatisticsHero } from './task-statistics-hero';
import { TaskStatisticsMetrics } from './task-statistics-metrics';
import { TaskStatisticsBreakdown } from './task-statistics-breakdown';
import { TaskStreakStrip } from './task-streak-strip';
import { TaskStreakHistory } from './task-streak-history';
import { ActivityBlock } from './activity-block';
import { TaskTimeSummary } from './task-time-summary';

export function TaskStatisticsContent({ state: s }: { state: TaskStatisticsState }) {
    const { t } = useTranslation();
    return (
        <>
            <TaskStatisticsHero items={s.todayQuery.data ?? []} />
            <SegmentedControl
                value={s.kind}
                onChange={s.setKind}
                options={[
                    { value: 'task', label: t('tasks.tasksTab') },
                    { value: 'habit', label: t('tasks.habitsTab') },
                ]}
            />
            <View
                style={{ alignItems: 'center', gap: 4 }}
                accessible
                accessibilityLabel={`${s.rate}% ${t('tasks.insights.completionRate')}`}
            >
                <Text className="font-sans-bold text-[56px] text-primary">{s.rate}%</Text>
                <Text className="font-sans-semibold text-sm text-muted-foreground">
                    {t('tasks.insights.completionRate')}
                </Text>
                <Text className="font-sans text-xs text-muted-foreground">
                    {t('tasks.insights.progressCount', { done: s.completed, total: s.total })}
                </Text>
            </View>
            <ActivityBlock title={t('tasks.insights.finished')}>
                <BarChart
                    data={s.bars}
                    maxValue={Math.max(1, ...s.bars.map((bar) => bar.value))}
                    labelFontSize={10}
                />
                <Text className="font-sans text-xs text-muted-foreground">
                    {t('tasks.insights.chartHint')}
                </Text>
            </ActivityBlock>
            <TaskStatisticsMetrics state={s} />
            <TaskStreakStrip
                current={s.query.data?.tasks.currentStreak ?? 0}
                days={(s.query.data?.tasks.streak90 ?? []).slice(-14)}
            />
            <TaskStatisticsBreakdown state={s} />
            <TaskTimeSummary from={s.from} to={s.to} />
            <ActivityBlock title={t('tasks.statsTrend')}>
                <LineChart
                    data={(s.stats?.trend ?? []).map((point) => ({
                        value: point.rate * 100,
                        label: statisticsDayLabel(point.week),
                    }))}
                    maxValue={100}
                    height={130}
                    showDataPoints
                    curved={false}
                    endSpacing={20}
                />
            </ActivityBlock>
            <TaskStreakHistory days={s.query.data?.tasks.streak90 ?? []} />
        </>
    );
}
