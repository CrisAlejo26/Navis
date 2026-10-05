import { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { FlatList, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ENTRY_KINDS, isEntryKind, type JournalQuery, type EntryKind } from '@navis/shared';
import { IconButton } from '@/components/ui/icon-button';
import { AppBar } from '@/components/ui/app-bar';
import { SearchField } from '@/components/ui/search-field';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { EmptyState } from '@/components/ui/empty-state';
import { useJournal, useJournalStats } from '@/hooks/use-journal';
import { useListContext } from '@/hooks/use-lists';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { shareJournalEntries } from '@/lib/journal/export';
import { JournalCard } from './journal-card';
import { JournalOverview } from './journal-overview';
import { JournalCalendar } from './journal-calendar';
import { JournalFilters } from './journal-filters';
import { JournalForm } from './journal-form';
import { JournalCover } from './journal-cover';
import { useJournalPalette } from './journal-theme';

type JournalView = 'cards' | 'table' | 'calendar';
export function JournalDirectory({ list = false }: { list?: boolean }) {
    const { t } = useTranslation(),
        p = useJournalPalette(),
        insets = useSafeAreaInsets(),
        scope = useListContext();
    const { width, fontScale } = useWindowDimensions();
    const stackedSelection = width < 360 || fontScale > 1.2;
    const gutter = width < 380 ? 16 : width >= 768 ? 32 : 20;
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
        [view, setView] = useState<JournalView>('cards');
    const [selectionMode, setSelectionMode] = useState(false),
        [scrolled, setScrolled] = useState(false);
    const [creating, setCreating] = useState(false),
        [filtersOpen, setFiltersOpen] = useState(false),
        [selected, setSelected] = useState(new Set<string>());
    const [exporting, setExporting] = useState(false),
        [exportError, setExportError] = useState(false);
    const debounced = useDebouncedValue(search),
        request = { ...query, search: debounced.trim() || undefined };
    const notes = useJournal(list ? request : { limit: 3, sort: 'date', order: 'desc' }),
        stats = useJournalStats();
    const rows = notes.data?.pages.flatMap((page) => page.items) ?? [];
    const count =
        (query.kind?.length ?? 0) +
        Number(Boolean(query.pendingReminder)) +
        Number(Boolean(query.from || query.to || (query.window && query.window !== 'all')));
    const openList = (next: JournalQuery) =>
        router.push({
            pathname: '/journal/list',
            params: {
                kind: next.kind?.[0],
                pending: next.pendingReminder ? 'true' : undefined,
                from: next.from,
                to: next.to,
            },
        });
    const toggle = (id: string) => {
        setSelectionMode(true);
        setSelected((before) => {
            const next = new Set(before);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };
    async function exportSelection() {
        setExporting(true);
        setExportError(false);
        try {
            await shareJournalEntries(scope.context, [...selected], true);
            setSelected(new Set());
            setSelectionMode(false);
        } catch {
            setExportError(true);
        } finally {
            setExporting(false);
        }
    }
    const header = (
        <View style={{ gap: list ? 12 : 20 }}>
            {!list && (
                <JournalCover
                    total={stats.data?.total ?? 0}
                    pending={stats.data?.pendingReminders ?? 0}
                />
            )}
            {list && (
                <>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <View style={{ flex: 1 }}>
                            <SearchField
                                value={search}
                                onChangeText={setSearch}
                                placeholder={t('journal.search')}
                            />
                        </View>
                        <IconButton
                            icon="options-outline"
                            size="lg"
                            accessibilityLabel={t(
                                count ? 'journal.filtersTotal' : 'journal.filters',
                                { total: count },
                            )}
                            onPress={() => setFiltersOpen(true)}
                            iconColor={p.link}
                        />
                    </View>
                    <SegmentedControl
                        value={view}
                        onChange={setView}
                        options={(['cards', 'table', 'calendar'] as const).map((value) => ({
                            value,
                            label: t(
                                value === 'table'
                                    ? 'journal.mobile.list'
                                    : `journal.views.${value}`,
                            ),
                        }))}
                    />
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ gap: 8 }}
                    >
                        <Chip
                            color={p.link}
                            label={t('common.all')}
                            selected={!query.kind?.length}
                            onPress={() => setQuery({ ...query, kind: undefined })}
                        />
                        {ENTRY_KINDS.map((kind: EntryKind) => (
                            <Chip
                                color={p.link}
                                key={kind}
                                label={t(`journal.kind.${kind}`)}
                                selected={query.kind?.includes(kind)}
                                onPress={() =>
                                    setQuery({
                                        ...query,
                                        kind: query.kind?.includes(kind)
                                            ? query.kind.filter((one) => one !== kind)
                                            : [...(query.kind ?? []), kind],
                                    })
                                }
                            />
                        ))}
                    </ScrollView>
                    {count > 0 && (
                        <Button
                            title={t('journal.clearFilters')}
                            variant="ghost"
                            onPress={() => setQuery({})}
                        />
                    )}
                    <View
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 12,
                        }}
                    >
                        <Text style={{ color: p.secondaryInk, fontSize: 12 }}>
                            {t('dataTable.resultsTotal', {
                                total: notes.data?.pages[0]?.total ?? 0,
                            })}
                        </Text>
                        {scope.canManage && (
                            <Button
                                title={
                                    selectionMode ? t('common.cancel') : t('journal.mobile.select')
                                }
                                variant="ghost"
                                size="sm"
                                onPress={() => {
                                    setSelectionMode(!selectionMode);
                                    setSelected(new Set());
                                }}
                            />
                        )}
                    </View>
                </>
            )}
        </View>
    );
    const empty = (
        <EmptyState
            icon="book-outline"
            title={search || count ? t('journal.noResults') : t('journal.emptyTitle')}
            description={t('journal.emptyBody')}
            action={
                scope.canManage
                    ? { label: t('journal.add'), onPress: () => setCreating(true) }
                    : undefined
            }
        />
    );
    return (
        <View style={{ flex: 1, backgroundColor: p.background }}>
            <AppBar title={t(list ? 'journal.title' : 'nav.journal')} transparent />
            {!list ? (
                <ScrollView
                    onScroll={(e) => setScrolled(e.nativeEvent.contentOffset.y > 48)}
                    scrollEventThrottle={100}
                    contentContainerStyle={{
                        paddingHorizontal: gutter,
                        paddingTop: 12,
                        paddingBottom:
                            insets.bottom + (selectionMode && stackedSelection ? 176 : 112),
                        gap: 24,
                        maxWidth: 720,
                        width: '100%',
                        alignSelf: 'center',
                    }}
                >
                    {header}
                    {rows.length > 0 && (
                        <View style={{ gap: 12 }}>
                            <View
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    gap: 8,
                                }}
                            >
                                <Text
                                    accessibilityRole="header"
                                    style={{
                                        color: p.ink,
                                        fontSize: 19,
                                        fontWeight: '700',
                                        flex: 1,
                                    }}
                                >
                                    {t('journal.mobile.recent')}
                                </Text>
                                <Button
                                    title={t('journal.mobile.seeAll')}
                                    variant="ghost"
                                    size="sm"
                                    onPress={() => openList({})}
                                />
                            </View>
                            {rows.slice(0, 3).map((entry) => (
                                <JournalCard
                                    key={entry.id}
                                    entry={entry}
                                    compact
                                    onPress={() =>
                                        router.push({
                                            pathname: '/journal/[id]',
                                            params: { id: entry.id },
                                        })
                                    }
                                />
                            ))}
                        </View>
                    )}
                    {notes.isError && (
                        <Button title={t('common.retry')} onPress={() => void notes.refetch()} />
                    )}
                    {stats.isPending ? (
                        <Text style={{ color: p.secondaryInk }}>{t('common.loading')}</Text>
                    ) : stats.isError ? (
                        <Button title={t('common.retry')} onPress={() => void stats.refetch()} />
                    ) : stats.data?.total ? (
                        <JournalOverview stats={stats.data} onOpen={openList} />
                    ) : (
                        empty
                    )}
                </ScrollView>
            ) : (
                <FlatList
                    onScroll={(e) => setScrolled(e.nativeEvent.contentOffset.y > 48)}
                    scrollEventThrottle={100}
                    data={view === 'calendar' ? [] : rows}
                    keyExtractor={(entry) => entry.id}
                    keyboardShouldPersistTaps="handled"
                    contentContainerStyle={{
                        paddingHorizontal: gutter,
                        paddingTop: 12,
                        paddingBottom:
                            insets.bottom + (selectionMode && stackedSelection ? 176 : 112),
                        gap: 12,
                        maxWidth: 720,
                        width: '100%',
                        alignSelf: 'center',
                    }}
                    ListHeaderComponent={
                        <View style={{ gap: 12, paddingBottom: 4 }}>
                            {header}
                            {view === 'calendar' && (
                                <JournalCalendar
                                    query={request}
                                    selection={selected}
                                    selectionMode={selectionMode}
                                    onSelect={toggle}
                                />
                            )}
                        </View>
                    }
                    renderItem={({ item }) => (
                        <JournalCard
                            entry={item}
                            compact={view === 'table'}
                            selected={selected.has(item.id)}
                            selectionMode={selectionMode}
                            onSelect={scope.canManage ? () => toggle(item.id) : undefined}
                            onPress={() =>
                                router.push({ pathname: '/journal/[id]', params: { id: item.id } })
                            }
                        />
                    )}
                    ListEmptyComponent={
                        view === 'calendar' ? null : notes.isPending ? (
                            <Text style={{ color: p.secondaryInk }}>{t('common.loading')}</Text>
                        ) : notes.isError ? (
                            <Button
                                title={t('common.retry')}
                                onPress={() => void notes.refetch()}
                            />
                        ) : (
                            empty
                        )
                    }
                    ListFooterComponent={
                        view !== 'calendar' && notes.hasNextPage ? (
                            <Button
                                title={t('notes.loadMore')}
                                variant="secondary"
                                loading={notes.isFetchingNextPage}
                                onPress={() => void notes.fetchNextPage()}
                            />
                        ) : null
                    }
                />
            )}
            {scope.canManage &&
                (selectionMode ? (
                    <View
                        style={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            backgroundColor: p.card,
                            borderTopWidth: 1,
                            borderColor: p.line,
                            padding: 16,
                            paddingBottom: insets.bottom + 16,
                            gap: 8,
                        }}
                    >
                        <View
                            style={{
                                flexDirection: stackedSelection ? 'column' : 'row',
                                alignItems: stackedSelection ? 'stretch' : 'center',
                                gap: 12,
                            }}
                        >
                            <Text
                                accessibilityLiveRegion="polite"
                                style={{ color: p.ink, flex: 1, fontSize: 14, fontWeight: '600' }}
                            >
                                {t('dataTable.selection.count', { count: selected.size })}
                            </Text>
                            <Button
                                title={t('journal.bulkExport')}
                                size="sm"
                                leadingIcon="download-outline"
                                disabled={!selected.size}
                                loading={exporting}
                                onPress={() => void exportSelection()}
                            />
                        </View>
                        {exportError && (
                            <Text accessibilityRole="alert" style={{ color: p.destructive }}>
                                {t('dataTable.selection.failed')}
                            </Text>
                        )}
                    </View>
                ) : (
                    <View style={{ position: 'absolute', bottom: insets.bottom + 16, right: 20 }}>
                        {scrolled || (stats.data?.total ?? 0) > 0 ? (
                            <IconButton
                                icon="add"
                                size="lg"
                                variant="primary"
                                className="rounded-full"
                                accessibilityLabel={t('journal.add')}
                                onPress={() => setCreating(true)}
                            />
                        ) : (
                            <Button
                                title={t('journal.add')}
                                className="px-5 rounded-full"
                                size="lg"
                                leadingIcon="add"
                                onPress={() => setCreating(true)}
                            />
                        )}
                    </View>
                ))}
            {creating && <JournalForm onClose={() => setCreating(false)} />}
            {filtersOpen && (
                <JournalFilters
                    query={query}
                    onChange={setQuery}
                    onClose={() => setFiltersOpen(false)}
                />
            )}
        </View>
    );
}
