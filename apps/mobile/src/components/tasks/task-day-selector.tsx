import { Pressable, ScrollView, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { addDays } from '@navis/shared';
import { getLocale } from '@/lib/i18n';
import { formatDay } from '@/lib/format';
import { DayProgress } from './day-progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useTaskPalette } from './task-theme';
import type { TaskTodayState } from './use-task-today';

export function TaskDaySelector({ state: s }: { state: TaskTodayState }) {
    const p = useTaskPalette(),
        { t } = useTranslation();
    return (
        <View style={{ gap: 10 }}>
            <View
                style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }}
            >
                <Text className="font-sans-semibold text-base text-foreground">
                    {formatDay(s.day)}
                </Text>
                <View style={{ flexDirection: 'row' }}>
                    {([-1, 1] as const).map((offset) => (
                        <Pressable
                            key={offset}
                            accessibilityRole="button"
                            accessibilityLabel={t(offset < 0 ? 'common.previous' : 'common.next')}
                            onPress={() => s.setDay(addDays(s.day, offset))}
                            style={{
                                width: 44,
                                height: 44,
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <Ionicons
                                name={offset < 0 ? 'chevron-back' : 'chevron-forward'}
                                size={20}
                                color={p.foreground}
                            />
                        </Pressable>
                    ))}
                </View>
            </View>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 9 }}
            >
                {s.days.map((day) => (
                    <Pressable
                        key={day.date}
                        accessibilityRole="button"
                        accessibilityLabel={
                            s.history.isPending
                                ? formatDay(day.date)
                                : t('tasks.mobile.calendarDay', {
                                      date: formatDay(day.date),
                                      total: day.total,
                                      done: day.done,
                                  })
                        }
                        accessibilityState={{ selected: day.date === s.day }}
                        onPress={() => s.setDay(day.date)}
                        style={{ width: 46, alignItems: 'center', gap: 7 }}
                    >
                        <Text className="font-sans-semibold text-xs text-muted-foreground">
                            {new Intl.DateTimeFormat(getLocale(), {
                                weekday: 'short',
                                timeZone: 'UTC',
                            }).format(new Date(`${day.date}T12:00:00Z`))}
                        </Text>
                        {s.history.isPending ? (
                            <Skeleton style={{ width: 40, height: 40, borderRadius: 20 }} />
                        ) : (
                            <DayProgress
                                day={day.date}
                                total={day.total}
                                done={day.done}
                                selected={day.date === s.day}
                                outside={false}
                            />
                        )}
                    </Pressable>
                ))}
            </ScrollView>
        </View>
    );
}
