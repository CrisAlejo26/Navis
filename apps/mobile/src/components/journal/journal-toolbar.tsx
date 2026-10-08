import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { IconButton } from '@/components/ui/icon-button';
import { SearchField } from '@/components/ui/search-field';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { Button } from '@/components/ui/button';
import { JournalActiveFilters } from './journal-active-filters';
import type { useJournalScreen } from '@/hooks/use-journal-screen';
import { useJournalTheme } from './journal-theme';

export function JournalToolbar({ screen: s }: { screen: ReturnType<typeof useJournalScreen> }) {
    const { t } = useTranslation(),
        p = useJournalTheme();
    return (
        <View style={{ gap: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={{ flex: 1 }}>
                    <SearchField
                        testID="journal-search"
                        value={s.search}
                        onChangeText={s.setSearch}
                        placeholder={t('journal.search')}
                    />
                </View>
                <IconButton
                    testID="journal-filters"
                    icon="options-outline"
                    size="lg"
                    accessibilityLabel={t(s.count ? 'journal.filtersTotal' : 'journal.filters', {
                        total: s.count,
                    })}
                    onPress={() => s.setFiltersOpen(true)}
                    iconColor={p.link}
                />
            </View>
            <SegmentedControl
                value={s.view}
                onChange={s.setView}
                options={
                    [
                        { value: 'cards', label: t('journal.views.cards') },
                        { value: 'table', label: t('journal.mobile.list') },
                        { value: 'calendar', label: t('journal.views.calendar') },
                    ] as const
                }
            />
            <JournalActiveFilters screen={s} />
            {s.count > 0 && (
                <Button title={t('journal.clearFilters')} variant="ghost" onPress={s.reset} />
            )}
            <View
                style={{
                    flexDirection: 'row',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                }}
            >
                <Text style={{ color: p.secondaryInk, fontSize: 12 }}>
                    {t('dataTable.resultsTotal', { total: s.notes.data?.pages[0]?.total ?? 0 })}
                </Text>
                {s.scope.canManage && (
                    <Button
                        title={t(s.selectionMode ? 'common.cancel' : 'journal.mobile.select')}
                        variant="ghost"
                        size="sm"
                        disabled={s.busy}
                        onPress={s.toggleSelectionMode}
                    />
                )}
            </View>
        </View>
    );
}
