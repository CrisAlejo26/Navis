import { addMonths, todayIn, type CustomTableColumn } from '@navis/shared';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import { CalendarGrid } from '@/components/ui/calendar-grid';
import { CalendarNav } from '@/components/ui/calendar-nav';
import { Button } from '@/components/ui/button';
import type { ViewState } from '@/lib/tables/view-state';
import { getLocale } from '@/lib/i18n';
export function CalendarHeader({
    column,
    state,
    onChange,
    counts,
    failed,
    onRetry,
    onCreate,
}: {
    column: CustomTableColumn;
    state: ViewState;
    onChange: (patch: Partial<ViewState>) => void;
    counts?: Record<string, number>;
    failed: boolean;
    onRetry: () => void;
    onCreate?: (data: Record<string, unknown>) => void;
}) {
    const { t } = useTranslation();
    const today = todayIn(Intl.DateTimeFormat().resolvedOptions().timeZone);
    function move(delta: number) {
        const month = addMonths(state.month, delta);
        onChange({ month, day: month, scroll: 0 });
    }
    function dateLabel(day: string) {
        return new Intl.DateTimeFormat(getLocale(), { dateStyle: 'full', timeZone: 'UTC' }).format(
            new Date(day + 'T12:00:00Z'),
        );
    }
    return (
        <View className="gap-3 pb-4">
            <CalendarNav month={state.month} onPrevious={() => move(-1)} onNext={() => move(1)} />
            <CalendarGrid
                month={state.month}
                today={today}
                isSelected={(day) => day === state.day}
                onSelectDay={(day) => onChange({ day, scroll: 0 })}
                counts={counts}
                dayLabel={(day) =>
                    dateLabel(day) + ', ' + t('export.rowsCount', { count: counts?.[day] ?? 0 })
                }
            />
            {failed ? <Button title={t('common.retry')} onPress={onRetry} /> : null}
            <View className="gap-3 flex-row">
                <Button
                    variant="secondary"
                    title={t('common.today')}
                    onPress={() => onChange({ month: today, day: today, scroll: 0 })}
                />
                <Button
                    variant="secondary"
                    title={t('tables.mobile.noDate')}
                    onPress={() => onChange({ day: null, scroll: 0 })}
                />
            </View>
            <Text className="font-sans-semibold text-foreground">
                {state.day ? dateLabel(state.day) : t('tables.mobile.noDate')}
            </Text>
            {onCreate ? (
                <Button
                    title={t('tables.newRow')}
                    onPress={() =>
                        onCreate(
                            state.day
                                ? {
                                      [column.key]: column.config?.includeTime
                                          ? new Date(state.day + 'T12:00:00').toISOString()
                                          : state.day,
                                  }
                                : {},
                        )
                    }
                />
            ) : null}
        </View>
    );
}
