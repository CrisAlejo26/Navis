import { ScrollView, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { TaskStreakDay } from '@navis/shared';
import { formatDay } from '@/lib/format';
import { FaroBeacon } from './faro-beacon';
import { useTaskPalette } from './task-theme';
import { ActivityBlock } from './activity-block';

export function TaskStreakStrip({ current, days }: { current: number; days: TaskStreakDay[] }) {
    const { t } = useTranslation(),
        p = useTaskPalette();
    return (
        <ActivityBlock title={t('tasks.insights.faro')}>
            <View style={{ flexDirection: 'row', gap: 13, alignItems: 'center' }}>
                <FaroBeacon active={current > 0} />
                <View style={{ flex: 1 }}>
                    <Text className="font-sans-semibold text-[15px] text-foreground">
                        {t('tasks.insights.days', { count: current })}
                    </Text>
                    <Text className="font-sans text-xs text-muted-foreground">
                        {t(
                            current > 0
                                ? 'tasks.insights.streakActive'
                                : 'tasks.insights.streakStart',
                        )}
                    </Text>
                </View>
            </View>
            <ScrollView
                horizontal
                contentContainerStyle={{ gap: 5 }}
                showsHorizontalScrollIndicator={false}
            >
                {days.map((day) => (
                    <View
                        key={day.date}
                        accessible
                        accessibilityLabel={`${formatDay(day.date)}: ${t(day.empty ? 'tasks.insights.noTasks' : day.completed ? 'tasks.mobile.dayComplete' : 'tasks.statusPending')}`}
                        style={{
                            width: 16,
                            height: 16,
                            borderRadius: 8,
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
            </ScrollView>
        </ActivityBlock>
    );
}
