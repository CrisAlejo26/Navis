import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { addMonths, type JournalQuery, type JournalEntryListItem } from '@navis/shared';
import { Text, View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { CalendarGrid } from '@/components/ui/calendar-grid';
import { CalendarNav } from '@/components/ui/calendar-nav';
import { Button } from '@/components/ui/button';
import { useListContext } from '@/hooks/use-lists';
import { listJournal } from '@/data/repos/journal-repo';
import { todayIso } from '@/data/repos/dashboard-repo';
import { JournalCard } from './journal-card';
import { useJournalPalette } from './journal-theme';

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
        p = useJournalPalette();
    const { width } = useWindowDimensions();
    const result = useQuery({
        queryKey: [
            'local-journal',
            scope.context.churchId,
            scope.context.userId,
            'calendar',
            month,
            query,
        ],
        enabled: scope.enabled,
        queryFn: async () => {
            const rows: JournalEntryListItem[] = [];
            const from = query.from && query.from > month ? query.from : month;
            const end = addMonths(month, 1);
            const endDate = new Date(`${end}T12:00:00`);
            endDate.setDate(0);
            const lastDay = `${month.slice(0, 7)}-${String(endDate.getDate()).padStart(2, '0')}`;
            const to = query.to && query.to < lastDay ? query.to : lastDay;
            let page = 1,
                totalPages: number;
            do {
                const response = await listJournal(scope.context, {
                    ...query,
                    from,
                    to,
                    limit: 100,
                    page,
                });
                rows.push(...response.items);
                totalPages = response.totalPages;
                page++;
            } while (page <= totalPages);
            return rows;
        },
    });
    const rows = result.data ?? [],
        counts: Record<string, number> = {};
    for (const entry of rows) counts[entry.occurredAt] = (counts[entry.occurredAt] ?? 0) + 1;
    const shift = (by: number) => {
        setMonth(addMonths(month, by));
        setDay(null);
    };
    return (
        <View style={{ gap: 16 }}>
            <View
                style={{
                    backgroundColor: p.surface,
                    padding: width < 360 ? 6 : 12,
                    marginHorizontal: width < 360 ? -10 : 0,
                    borderRadius: 24,
                    gap: 8,
                }}
            >
                <CalendarNav month={month} onPrevious={() => shift(-1)} onNext={() => shift(1)} />
                <CalendarGrid
                    compact
                    month={month}
                    today={today}
                    counts={counts}
                    isSelected={(one) => day === one}
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
                style={{ color: p.ink, fontSize: 17, fontWeight: '700' }}
            >
                {day ? t('journal.mobile.dayEntries') : t('journal.mobile.recent')}
            </Text>
            {result.isPending ? (
                <Text style={{ color: p.secondaryInk }}>{t('common.loading')}</Text>
            ) : result.isError ? (
                <Button title={t('common.retry')} onPress={() => void result.refetch()} />
            ) : (day ? rows.filter((one) => one.occurredAt === day) : rows).length === 0 ? (
                <Text style={{ color: p.secondaryInk, textAlign: 'center', padding: 24 }}>
                    {t('journal.noResults')}
                </Text>
            ) : (
                (day ? rows.filter((one) => one.occurredAt === day) : rows).map((entry) => (
                    <JournalCard
                        key={entry.id}
                        entry={entry}
                        selected={selection.has(entry.id)}
                        selectionMode={selectionMode}
                        onSelect={scope.canManage ? () => onSelect(entry.id) : undefined}
                        onPress={() =>
                            router.push({ pathname: '/journal/[id]', params: { id: entry.id } })
                        }
                    />
                ))
            )}
        </View>
    );
}
