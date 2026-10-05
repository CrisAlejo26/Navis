import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { JournalQuery } from '@navis/shared';
import { useListContext } from './use-lists';
import {
    findJournalEntry,
    journalStats,
    listJournal,
    type JournalContext,
} from '@/data/repos/journal-repo';
import { syncNotifications } from '@/lib/notifications/sync';

const key = (context: JournalContext) => ['local-journal', context.churchId, context.userId];
export function useJournal(query: JournalQuery) {
    const scope = useListContext();
    return useInfiniteQuery({
        queryKey: [...key(scope.context), 'list', query],
        enabled: scope.enabled,
        initialPageParam: 1,
        queryFn: ({ pageParam }) => listJournal(scope.context, { ...query, page: pageParam }),
        getNextPageParam: (last) => (last.page < last.totalPages ? last.page + 1 : undefined),
    });
}
export function useJournalStats() {
    const scope = useListContext();
    return useQuery({
        queryKey: [...key(scope.context), 'stats'],
        enabled: scope.enabled,
        queryFn: () => journalStats(scope.context),
    });
}
export function useJournalEntry(id: string) {
    const scope = useListContext();
    return useQuery({
        queryKey: [...key(scope.context), 'detail', id],
        enabled: scope.enabled && Boolean(id),
        queryFn: () => findJournalEntry(scope.context, id),
    });
}
export function useJournalMutation<T, R>(
    operation: (context: JournalContext, input: T) => Promise<R>,
) {
    const scope = useListContext(),
        client = useQueryClient();
    return useMutation({
        mutationFn: (input: T) => {
            if (!scope.enabled || !scope.canManage) throw new Error('not-found');
            return operation(scope.context, input);
        },
        onSuccess: async () => {
            await client.invalidateQueries({ queryKey: key(scope.context) });
            await syncNotifications();
        },
    });
}
