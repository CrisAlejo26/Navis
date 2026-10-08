import { useQuery } from '@tanstack/react-query';
import {
    addMonths,
    journalWindowStart,
    type JournalQuery,
    type JournalEntryListItem,
} from '@navis/shared';
import { useListContext } from './use-lists';
import { listJournal } from '@/data/repos/journal-repo';
import { todayIso } from '@/data/repos/dashboard-repo';

export function useJournalCalendar(month: string, query: JournalQuery) {
    const scope = useListContext();
    return useQuery({
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
            const today = todayIso(),
                windowFrom = journalWindowStart(query.window ?? 'all', today);
            const from = [month, query.from ?? windowFrom ?? month].sort().at(-1) ?? month;
            const end = new Date(`${addMonths(month, 1)}T12:00:00`);
            end.setDate(0);
            const last = `${month.slice(0, 7)}-${String(end.getDate()).padStart(2, '0')}`;
            const to = [last, query.to ?? (windowFrom ? today : last)].sort()[0];
            if (from > to) return rows;
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
}
