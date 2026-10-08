import { SectionList, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { getLocale } from '@/lib/i18n';
import { JournalCard } from './journal-card';
import { JournalCardSkeleton } from './journal-card-skeleton';
import { JournalToolbar } from './journal-toolbar';
import { JournalCalendar } from './journal-calendar';
import { JournalSectionHeader } from './journal-section-header';
import { openJournalEntry } from './journal-navigation';
import type { useJournalScreen } from '@/hooks/use-journal-screen';

export function JournalList({
    screen: s,
    bottom,
}: {
    screen: ReturnType<typeof useJournalScreen>;
    bottom: number;
}) {
    const { t } = useTranslation();
    const months = new Map<string, typeof s.rows>();
    for (const row of s.rows) {
        const month = row.occurredAt.slice(0, 7);
        months.set(month, [...(months.get(month) ?? []), row]);
    }
    const sections =
        s.view === 'calendar'
            ? []
            : [...months].map(([month, data]) => ({
                  title: new Intl.DateTimeFormat(getLocale(), {
                      month: 'long',
                      year: 'numeric',
                      timeZone: 'UTC',
                  }).format(new Date(`${month}-01T00:00:00Z`)),
                  data,
              }));
    const filtered = Boolean(s.search || s.count);
    return (
        <SectionList
            sections={sections}
            keyExtractor={(entry) => entry.id}
            stickySectionHeadersEnabled={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            contentContainerStyle={{
                paddingHorizontal: 22,
                paddingTop: 12,
                paddingBottom: bottom,
                maxWidth: 480,
                width: '100%',
                alignSelf: 'center',
            }}
            ListHeaderComponent={
                <View style={{ gap: 16 }}>
                    <JournalToolbar screen={s} />
                    {s.view === 'calendar' && (
                        <JournalCalendar
                            query={s.request}
                            selection={s.selected}
                            selectionMode={s.selectionMode}
                            onSelect={s.toggle}
                        />
                    )}
                </View>
            }
            renderSectionHeader={({ section }) => (
                <JournalSectionHeader title={section.title} count={section.data.length} />
            )}
            ItemSeparatorComponent={() => <View style={{ height: 13 }} />}
            renderItem={({ item }) => (
                <JournalCard
                    entry={item}
                    compact={s.view === 'table'}
                    selected={s.selected.has(item.id)}
                    selectionMode={s.selectionMode}
                    busy={s.busy}
                    onPress={() => openJournalEntry(item.id)}
                    onSelect={s.scope.canManage ? () => s.toggle(item.id) : undefined}
                    onEdit={s.scope.canManage ? () => s.setEditingId(item.id) : undefined}
                    onAttend={s.scope.canManage ? () => s.attend(item.id) : undefined}
                    onDelete={
                        s.scope.canManage ? () => s.confirmDelete([item.id], item.title) : undefined
                    }
                />
            )}
            ListEmptyComponent={
                s.view === 'calendar' ? null : s.notes.isPending ? (
                    <View style={{ gap: 13, marginTop: 16 }}>
                        <JournalCardSkeleton />
                        <JournalCardSkeleton />
                        <JournalCardSkeleton />
                    </View>
                ) : s.notes.isError ? (
                    <EmptyState
                        icon="book-outline"
                        title={t('errors.generic')}
                        action={{ label: t('common.retry'), onPress: () => void s.notes.refetch() }}
                    />
                ) : (
                    <EmptyState
                        icon="book-outline"
                        title={t(filtered ? 'journal.noResults' : 'journal.emptyTitle')}
                        description={t(
                            filtered ? 'journal.mobile.noResultsBody' : 'journal.emptyBody',
                        )}
                        action={
                            filtered
                                ? { label: t('journal.clearFilters'), onPress: s.reset }
                                : undefined
                        }
                    />
                )
            }
            ListFooterComponent={
                s.view !== 'calendar' && s.notes.hasNextPage ? (
                    <View style={{ paddingVertical: 16 }}>
                        {s.notes.isFetchingNextPage ? (
                            <JournalCardSkeleton />
                        ) : (
                            <Button
                                title={t('notes.loadMore')}
                                variant="secondary"
                                onPress={() => void s.notes.fetchNextPage()}
                            />
                        )}
                    </View>
                ) : null
            }
        />
    );
}
