import { Pressable, Text, View, useWindowDimensions } from 'react-native';

import { cn } from '@/lib/cn';
import { buildDateGrid, isInMonth } from '@/lib/ui/date-grid';
import type { IsoDate } from '@navis/shared';
import type { ReactNode } from 'react';

interface CalendarGridProps {
    renderDay?: (day: IsoDate, selected: boolean, outside: boolean) => ReactNode;
    /** Cualquier día del mes que se enseña. */
    month: IsoDate;
    today: IsoDate;
    isSelected: (day: IsoDate) => boolean;
    /** Para el tramo de un `DateRangePicker`; sin ella, ninguna celda lo lleva. */
    isInRange?: (day: IsoDate) => boolean;
    onSelectDay: (day: IsoDate) => void;
    counts?: Record<string, number>;
    dayLabel?: (day: IsoDate) => string;
    compact?: boolean;
}

/**
 * La cuadrícula de un mes, compartida por `DatePicker` y `DateRangePicker`
 * (Fase 5): cada uno decide qué está seleccionado, esta solo pinta y avisa.
 */
export function CalendarGrid({
    month,
    today,
    isSelected,
    isInRange,
    onSelectDay,
    counts,
    dayLabel,
    compact = false,
    renderDay,
}: CalendarGridProps) {
    const grid = buildDateGrid(month);
    const { fontScale } = useWindowDimensions();

    return (
        <View className="gap-1">
            <View className="flex-row">
                {grid.weekdayLabels.map((label, index) => (
                    <Text
                        key={index}
                        className="text-xs font-sans-medium flex-1 text-center text-muted-foreground"
                    >
                        {label}
                    </Text>
                ))}
            </View>
            {grid.weeks.map((week, weekIndex) => (
                <View key={weekIndex} className="flex-row">
                    {week.map((day) => {
                        const selected = isSelected(day);
                        const inRange = !selected && Boolean(isInRange?.(day));
                        const outside = !isInMonth(day, month);
                        return (
                            <Pressable
                                key={day}
                                accessibilityRole="button"
                                accessibilityState={{ selected }}
                                accessibilityLabel={dayLabel?.(day) ?? day}
                                onPress={() => onSelectDay(day)}
                                className={cn(
                                    'flex-1 items-center justify-center',
                                    !compact && 'aspect-square',
                                )}
                                style={
                                    compact ? { minHeight: 48 * Math.max(1, fontScale) } : undefined
                                }
                            >
                                {renderDay ? (
                                    renderDay(day, selected, outside)
                                ) : (
                                    <View
                                        className={cn(
                                            'items-center justify-center rounded-full',
                                            compact ? 'min-h-8 min-w-8 p-1' : 'h-8 w-8',
                                            selected && 'bg-primary',
                                            inRange && 'bg-muted',
                                            day === today && !selected && 'border border-primary',
                                        )}
                                    >
                                        <Text
                                            className={cn(
                                                'text-sm font-sans',
                                                selected
                                                    ? 'text-primary-foreground'
                                                    : 'text-foreground',
                                                outside &&
                                                    !selected &&
                                                    'text-muted-foreground opacity-50',
                                            )}
                                        >
                                            {Number(day.slice(8, 10))}
                                        </Text>
                                    </View>
                                )}
                                {counts?.[day] ? (
                                    <Text className="text-xs font-sans text-muted-foreground">
                                        {counts[day]}
                                    </Text>
                                ) : null}
                            </Pressable>
                        );
                    })}
                </View>
            ))}
        </View>
    );
}
