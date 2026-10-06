import { ScrollView, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { TaskStatisticsContent } from './task-statistics-content';
import { EmptyState } from '@/components/ui/empty-state';
import { formatDay } from '@/lib/format';
import { useTaskStatistics } from './use-task-statistics';
import { TaskAppBar } from './task-app-bar';
import { TaskNavigation } from './task-navigation';
import { TaskStatisticsSkeleton } from './task-statistics-skeleton';

export function TaskStatisticsScreen() {
    const s = useTaskStatistics(),
        { t } = useTranslation(),
        insets = useSafeAreaInsets();
    return (
        <View className="flex-1 bg-background">
            <TaskAppBar title={t('tasks.stats')} date={s.today} />
            <TaskNavigation active="stats" />
            <ScrollView
                contentContainerStyle={{
                    padding: 22,
                    paddingBottom: insets.bottom + 24,
                    width: '100%',
                    maxWidth: 480,
                    alignSelf: 'center',
                    gap: 22,
                }}
            >
                <Text className="font-sans-bold text-[26px] text-foreground">
                    {t('tasks.stats')}
                </Text>
                <SegmentedControl
                    value={s.period}
                    onChange={s.setPeriod}
                    options={[
                        { value: 'week', label: t('tasks.insights.week') },
                        { value: 'month', label: t('tasks.insights.month') },
                    ]}
                />
                <Text className="font-sans text-xs text-muted-foreground">
                    {formatDay(s.from)} — {formatDay(s.to)}
                </Text>
                {s.error ? (
                    <EmptyState
                        icon="cloud-offline-outline"
                        title={t('errors.generic')}
                        action={{ label: t('common.retry'), onPress: s.retry }}
                    />
                ) : s.pendingData ? (
                    <TaskStatisticsSkeleton />
                ) : (
                    <TaskStatisticsContent state={s} />
                )}
            </ScrollView>
        </View>
    );
}
