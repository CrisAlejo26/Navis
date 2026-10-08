import { useState } from 'react';
import { addMonths, type JournalQuery, type EntryKind } from '@navis/shared';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { CalendarGrid } from '@/components/ui/calendar-grid';
import { CalendarNav } from '@/components/ui/calendar-nav';
import { Button } from '@/components/ui/button';
import { useListContext } from '@/hooks/use-lists';
import { useJournalCalendar } from '@/hooks/use-journal-calendar';
import { todayIso } from '@/data/repos/dashboard-repo';
import { JournalCard } from './journal-card';
import { JournalCalendarDay } from './journal-calendar-day';
import { JournalCardSkeleton } from './journal-card-skeleton';
import { useJournalTheme } from './journal-theme';
import { openJournalEntry } from './journal-navigation';

export function JournalCalendar({
    query,
    selection,
    onSelect,
    selectionMode,
}: {
    query: JournalQuery;
    selection: Set<string>;
    selectionMode: boolean;
    onSelect: (id: string) => void;
}) {
    const today = todayIso(),
        [month, setMonth] = useState(today.slice(0, 7) + '-01'),
        [day, setDay] = useState<string | null>(null);
    const scope = useListContext(),
        { t } = useTranslation(),
        p = useJournalTheme(),
        result = useJournalCalendar(month, query);
    const rows = result.data ?? [],
        counts: Record<string, number> = {},
        kinds: Record<string, EntryKind[]> = {};
    for (const entry of rows) {
        counts[entry.occurredAt] = (counts[entry.occurredAt] ?? 0) + 1;
        kinds[entry.occurredAt] = [...new Set([...(kinds[entry.occurredAt] ?? []), entry.kind])];
    }
    const visible = day ? rows.filter((entry) => entry.occurredAt === day) : rows;
    const shift = (by: number) => {
        setMonth(addMonths(month, by));
        setDay(null);
    };
    return (
        <View style={{ gap: 16 }}>
            <View style={{ backgroundColor: p.surface, padding: 6, borderRadius: 26, gap: 8 }}>
                <CalendarNav month={month} onPrevious={() => shift(-1)} onNext={() => shift(1)} />
                <CalendarGrid
                    compact
                    month={month}
                    today={today}
                    isSelected={(one) => day === one}
                    renderDay={(one, selected, outside) => (
                        <JournalCalendarDay
                            day={one}
                            selected={selected}
                            outside={outside}
                            today={today}
                            kinds={kinds[one] ?? []}
                        />
                    )}
                    dayLabel={(one) =>
                        t('journal.calendarDay', { date: one, total: counts[one] ?? 0 })
                    }
                    onSelectDay={(one) => {
                        if (one.slice(0, 7) !== month.slice(0, 7))
                            setMonth(one.slice(0, 7) + '-01');
                        setDay(day === one ? null : one);
                    }}
                />
            </View>
            <Text
                accessibilityRole="header"
                className="font-sans-semibold"
                style={{ color: p.ink, fontSize: 17 }}
            >
                {t(day ? 'journal.mobile.dayEntries' : 'journal.mobile.recent')}
            </Text>
            {result.isPending ? (
                <JournalCardSkeleton />
            ) : result.isError ? (
                <Button title={t('common.retry')} onPress={() => void result.refetch()} />
            ) : visible.length === 0 ? (
                <Text style={{ color: p.secondaryInk, textAlign: 'center', padding: 24 }}>
                    {t('journal.noResults')}
                </Text>
            ) : (
                visible.map((entry) => (
                    <JournalCard
                        key={entry.id}
                        entry={entry}
                        selected={selection.has(entry.id)}
                        selectionMode={selectionMode}
                        onSelect={scope.canManage ? () => onSelect(entry.id) : undefined}
                        onPress={() => openJournalEntry(entry.id)}
                    />
                ))
            )}
        </View>
    );
}
