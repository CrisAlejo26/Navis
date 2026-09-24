import { Pressable, Text, View } from 'react-native';

import { cn } from '@/lib/cn';
import { accentHex } from '@/lib/accent';
import { useThemeStore } from '@/lib/theme';
import { themeColorsHex } from '@navis/theme';
import { buildDateGrid, isInMonth } from '@/lib/ui/date-grid';
import type { IsoDate, Meeting } from '@navis/shared';

interface CalendarMonthProps {
    /** Cualquier día del mes que se enseña. */
    month: IsoDate;
    today: IsoDate;
    /** Lo que hay detrás de cada día: reuniones por fecha y festivo por fecha. */
    meetingsOf: (date: IsoDate) => Meeting[];
    holidayOf: (date: IsoDate) => string | null;
    onOpenDay: (date: IsoDate) => void;
}

/**
 * La rejilla del mes del calendario (RFC 0002 §8.3): el día de hoy en azul de
 * marca, una barra del color de cada reunión —máximo dos, «+n» si hay más— y
 * el punto rojo de festivo, la convención del calendario de pared. Reutiliza
 * la aritmética de `buildDateGrid`, la misma de `CalendarGrid`.
 */
export function CalendarMonth({
    month,
    today,
    meetingsOf,
    holidayOf,
    onOpenDay,
}: CalendarMonthProps) {
    const palette = themeColorsHex[useThemeStore((state) => state.resolvedTheme)];
    const grid = buildDateGrid(month);

    return (
        <View className="min-h-0 gap-1 flex-1">
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
            {/*
             * La rejilla **reparte el alto que hay**: las semanas son `flex-1`, así
             * que el mes ocupa el espacio entero de la pantalla y no se va con
             * scroll — el máximo es el que manda el teléfono, no el contenido.
             */}
            {grid.weeks.map((week, weekIndex) => (
                <View key={weekIndex} className="min-h-0 gap-1 flex-1 flex-row">
                    {week.map((day) => {
                        const meetings = meetingsOf(day);
                        const outside = !isInMonth(day, month);
                        const esHoy = day === today;

                        return (
                            <Pressable
                                key={day}
                                accessibilityRole="button"
                                accessibilityLabel={`${day}: ${meetings.length} reuniones${
                                    holidayOf(day) ? `, festivo: ${holidayOf(day)}` : ''
                                }`}
                                onPress={() => onOpenDay(day)}
                                className={cn(
                                    'p-1 gap-0.5 min-h-[44px] flex-1 rounded-lg',
                                    outside ? 'opacity-40' : 'bg-card',
                                    esHoy && !outside && 'border border-brand bg-brand/10',
                                )}
                            >
                                <View className="gap-1 flex-row items-center">
                                    <Text
                                        className={cn(
                                            'text-sm font-sans',
                                            esHoy
                                                ? 'font-sans-semibold text-brand'
                                                : 'text-foreground',
                                            holidayOf(day) && !esHoy && 'text-destructive',
                                        )}
                                    >
                                        {Number(day.slice(8, 10))}
                                    </Text>
                                    {holidayOf(day) ? (
                                        <View className="h-1 w-1 rounded-full bg-destructive" />
                                    ) : null}
                                </View>
                                <View className="gap-0.5">
                                    {meetings.slice(0, 2).map((meeting, index) => (
                                        <View
                                            key={index}
                                            className="h-1 rounded-full"
                                            style={{
                                                backgroundColor: accentHex(meeting.accent, palette),
                                            }}
                                        />
                                    ))}
                                    {meetings.length > 2 ? (
                                        <Text className="text-[10px] text-muted-foreground">
                                            +{meetings.length - 2}
                                        </Text>
                                    ) : null}
                                </View>
                            </Pressable>
                        );
                    })}
                </View>
            ))}
        </View>
    );
}
