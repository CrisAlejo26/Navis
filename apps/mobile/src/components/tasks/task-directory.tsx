import { View, SectionList } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { AppBar } from '@/components/ui/app-bar';
import { TaskDirectoryEmpty } from './directory-empty';
import { TaskDirectoryFooter } from './directory-footer';
import { activityKey } from '@/lib/tasks/filters';
import { useTaskDirectory } from './use-task-directory';
import { DirectoryHeader } from './directory-header';
import { TaskSection } from './task-section';
import { TaskCard } from './task-card';
import { TaskFiltersScreen } from './task-filters';
import { TaskActions } from './task-actions';
import { useTaskPalette } from './task-theme';

export function TaskDirectory() {
    const s = useTaskDirectory(),
        insets = useSafeAreaInsets(),
        p = useTaskPalette(),
        { t } = useTranslation();
    return (
        <View style={{ flex: 1, backgroundColor: p.background }}>
            <AppBar title={t('tasks.list')} />
            <SectionList
                sections={s.sections}
                keyExtractor={activityKey}
                stickySectionHeadersEnabled={false}
                initialNumToRender={12}
                maxToRenderPerBatch={10}
                windowSize={7}
                onEndReachedThreshold={0.6}
                onEndReached={() => {
                    if (s.listing.hasNextPage && !s.listing.isFetchingNextPage)
                        void s.listing.fetchNextPage();
                }}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{
                    paddingHorizontal: 22,
                    paddingBottom: insets.bottom + 24,
                    width: '100%',
                    maxWidth: 480,
                    alignSelf: 'center',
                }}
                ListHeaderComponent={<DirectoryHeader state={s} />}
                renderSectionHeader={({ section }) => (
                    <TaskSection section={section} group={s.filters.group} today={s.today} />
                )}
                renderItem={({ item }) => (
                    <TaskCard
                        item={item}
                        busy={s.action.isPending}
                        onPress={() => s.setSelected(item)}
                        onToggle={() =>
                            void s.change(
                                item,
                                item.status === 'completada' ? 'pendiente' : 'completada',
                            )
                        }
                        onDelete={() => s.remove(item)}
                    />
                )}
                ListEmptyComponent={<TaskDirectoryEmpty state={s} />}
                ListFooterComponent={<TaskDirectoryFooter state={s} />}
            />
            {s.filtersOpen && (
                <TaskFiltersScreen
                    filters={s.filters}
                    today={s.today}
                    timezone={s.timezone}
                    onClose={() => s.setFiltersOpen(false)}
                    onApply={(filters) => {
                        s.setFilters(filters);
                        s.setFiltersOpen(false);
                    }}
                />
            )}
            {s.selected && (
                <TaskActions
                    item={s.selected}
                    busy={s.action.isPending}
                    onClose={() => s.setSelected(null)}
                    onStatus={(status) => {
                        if (s.selected) void s.change(s.selected, status);
                    }}
                    onDelete={() => {
                        if (s.selected) s.remove(s.selected);
                    }}
                />
            )}
        </View>
    );
}
