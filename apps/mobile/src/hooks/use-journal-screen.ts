import { useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { isEntryKind, type JournalQuery } from '@navis/shared';
import { useJournal, useJournalStats } from './use-journal';
import { useListContext } from './use-lists';
import { useDebouncedValue } from './use-debounced-value';
import { useJournalActions } from './use-journal-actions';
import { journalFilterCount } from '@/components/journal/journal-navigation';

export function useJournalScreen(list: boolean) {
    const scope = useListContext();
    const params = useLocalSearchParams<{
        kind?: string;
        pending?: string;
        from?: string;
        to?: string;
    }>();
    const [query, setQuery] = useState<JournalQuery>(() => ({
        kind: params.kind && isEntryKind(params.kind) ? [params.kind] : undefined,
        pendingReminder: params.pending === 'true',
        from: params.from,
        to: params.to,
    }));
    const [search, setSearch] = useState(''),
        [view, setView] = useState<'cards' | 'table' | 'calendar'>('cards');
    const [creating, setCreating] = useState(false),
        [filtersOpen, setFiltersOpen] = useState(false);
    const debounced = useDebouncedValue(search),
        request = { ...query, search: debounced.trim() || undefined };
    const notes = useJournal(list ? request : { limit: 3, sort: 'date', order: 'desc' }),
        stats = useJournalStats();
    const rows = notes.data?.pages.flatMap((page) => page.items) ?? [];
    const actions = useJournalActions();
    return {
        scope,
        query,
        setQuery,
        search,
        setSearch,
        view,
        setView,
        creating,
        setCreating,
        filtersOpen,
        setFiltersOpen,
        request,
        notes,
        stats,
        rows,
        count: journalFilterCount(query),
        reset: () => {
            setSearch('');
            setQuery({});
        },
        ...actions,
    };
}
