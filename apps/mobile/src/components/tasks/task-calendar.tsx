import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { addMonths } from '@navis/shared';
import { CalendarGrid } from '@/components/ui/calendar-grid';
import { CalendarNav } from '@/components/ui/calendar-nav';
import { ProgressRing } from '@/components/ui/progress-ring';
import { listCardShadow } from '@/lib/ui/elevation';
import type { ActivityItem } from '@/lib/tasks/filters';
import { DayProgress } from './day-progress';
import { useTaskPalette } from './task-theme';
export function TaskCalendar({
    month,
    today,
    selected,
    items,
    onMonth,
    onSelect,
}: {
    month: string;
    today: string;
    selected: string;
    items: ActivityItem[];
    onMonth: (month: string) => void;
    onSelect: (day: string) => void;
}) {
    const p = useTaskPalette(),
        { t } = useTranslation();
    const counts: Record<string, { total: number; done: number }> = {};
    for (const item of items) {
        const cell = (counts[item.date] ??= { total: 0, done: 0 });
        cell.total++;
        if (item.status === 'completada') cell.done++;
    }
    return (
        <View
            style={{
                padding: 15,
                borderRadius: 26,
                backgroundColor: p.card,
                ...listCardShadow(p.primary, p.dark),
                marginTop: 18,
                marginBottom: 4,
            }}
        >
            <CalendarNav
                compact
                month={month}
                onPrevious={() => onMonth(addMonths(month, -1))}
                onNext={() => onMonth(addMonths(month, 1))}
            />
            <CalendarGrid
                compact
                month={month}
                today={today}
                isSelected={(day) => day === selected}
                onSelectDay={onSelect}
                dayLabel={(day) =>
                    t('tasks.mobile.calendarDay', {
                        date: day,
                        done: counts[day]?.done ?? 0,
                        total: counts[day]?.total ?? 0,
                    })
                }
                renderDay={(day, active, outside) => (
                    <DayProgress
                        day={day}
                        selected={active}
                        outside={outside}
                        total={counts[day]?.total ?? 0}
                        done={counts[day]?.done ?? 0}
                    />
                )}
            />
            <View className="gap-3 mt-3 flex-row flex-wrap items-center justify-center">
                <Text className="font-sans-medium text-xs text-muted-foreground">
                    {t('tasks.mobile.dayComplete')}
                </Text>
                <ProgressRing size={14} strokeWidth={2} progress={0.4} />
                <Text className="font-sans-medium text-xs text-muted-foreground">
                    {t('tasks.mobile.dayPartial')}
                </Text>
            </View>
        </View>
    );
}
