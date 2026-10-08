import { router } from 'expo-router';
import type { JournalQuery } from '@navis/shared';

export function openJournalEntry(id: string): void {
    router.push({ pathname: '/journal/[id]', params: { id } });
}
export function openJournalList(query: JournalQuery): void {
    router.push({
        pathname: '/journal/list',
        params: {
            kind: query.kind?.[0],
            pending: query.pendingReminder ? 'true' : undefined,
            from: query.from,
            to: query.to,
        },
    });
}
export function journalFilterCount(query: JournalQuery): number {
    return (
        (query.kind?.length ?? 0) +
        Number(Boolean(query.pendingReminder)) +
        Number(Boolean(query.from || query.to || (query.window && query.window !== 'all')))
    );
}
