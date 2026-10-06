import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { Chip } from '@/components/ui/chip';
import { Button } from '@/components/ui/button';
import { TaskSkeleton } from './task-skeleton';
import { TaskDaySelector } from './task-day-selector';
import { TaskStreakStrip } from './task-streak-strip';
import type { TaskTodayState } from './use-task-today';

export function TaskTodayHeader({ state: s }: { state: TaskTodayState }) {
    const { t } = useTranslation();
    return (
        <View style={{ gap: 18, paddingTop: 8, paddingBottom: 18 }}>
            <Text className="font-sans-bold text-[26px] text-foreground">
                {t(s.day === s.today ? 'tasks.today' : 'tasks.insights.yourDay')}
            </Text>
            <TaskDaySelector state={s} />
            {s.streak.isError || s.history.isError ? (
                <Button
                    title={t('common.retry')}
                    variant="outline"
                    onPress={() => {
                        void s.streak.refetch();
                        void s.history.refetch();
                    }}
                />
            ) : s.streak.isPending || s.history.isPending ? (
                <TaskSkeleton />
            ) : (
                <TaskStreakStrip current={s.streak.data?.current ?? 0} days={s.strip} />
            )}
            <SegmentedControl
                value={s.kind}
                onChange={s.setKind}
                options={[
                    { value: 'habit', label: t('tasks.habitsTab') },
                    { value: 'task', label: t('tasks.tasksTab') },
                ]}
            />
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {(['all', 'pending', 'done'] as const).map((value) => (
                    <Chip
                        key={value}
                        selected={s.filter === value}
                        label={t(
                            value === 'all'
                                ? 'tasks.filterBoth'
                                : value === 'pending'
                                  ? 'tasks.filterPending'
                                  : 'tasks.filterDone',
                        )}
                        onPress={() => s.setFilter(value)}
                    />
                ))}
            </View>
        </View>
    );
}
