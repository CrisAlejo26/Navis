import { FlatList, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { moveInTaskOrder, moveSelectedTasks } from '@navis/shared';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppBar } from '@/components/ui/app-bar';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { ActivityQueryState } from './activity-query-state';
import { TaskOrderHeader } from './task-order-header';
import { TaskOrderRow } from './task-order-row';
import { TaskListSkeleton } from './task-loading';
import { useTaskOrderScreen } from './use-task-order';

export function TaskOrderScreen() {
    const { t } = useTranslation(),
        insets = useSafeAreaInsets(),
        o = useTaskOrderScreen(),
        { query, mutation, items, setItems } = o;
    if (query.isPending || query.isError)
        return (
            <ActivityQueryState
                title={t('tasks.orderTasks')}
                layout="order"
                pending={query.isPending}
                error={query.isError}
                onRetry={() => void query.refetch()}
            />
        );
    return (
        <View className="flex-1 bg-background">
            <AppBar title={t('tasks.orderTasks')} />
            <FlatList
                scrollEnabled={!o.dragging}
                data={items}
                keyExtractor={(task) => task.id}
                contentContainerStyle={{
                    padding: 22,
                    width: '100%',
                    maxWidth: 480,
                    alignSelf: 'center',
                }}
                ListHeaderComponent={
                    <TaskOrderHeader
                        selectedCount={o.selected.length}
                        busy={mutation.isPending}
                        onMove={(direction) =>
                            setItems((previous) =>
                                moveSelectedTasks(previous, o.selected, direction),
                            )
                        }
                    />
                }
                renderItem={({ item, index }) => (
                    <TaskOrderRow
                        task={item}
                        index={index}
                        total={items.length}
                        selected={o.selected.includes(item.id)}
                        busy={mutation.isPending}
                        select={() => o.toggle(item.id)}
                        move={(to) => setItems((previous) => moveInTaskOrder(previous, index, to))}
                        start={o.start}
                        drop={(y) => o.drop(index, y)}
                        cancel={() => o.setDragging(false)}
                        rowRef={o.registerRow(item.id)}
                    />
                )}
                ListEmptyComponent={
                    <EmptyState icon="clipboard-outline" title={t('tasks.noTasks')} />
                }
                ListFooterComponent={
                    query.isFetchingNextPage ? (
                        <TaskListSkeleton kind="order" count={2} />
                    ) : query.hasNextPage && items.length < 1000 ? (
                        <Button
                            title={t('notes.loadMore')}
                            variant="outline"
                            onPress={() => void query.fetchNextPage()}
                        />
                    ) : null
                }
            />
            <View className="gap-2 pt-3 px-[22px]" style={{ paddingBottom: insets.bottom + 14 }}>
                <Button
                    title={t('common.save')}
                    loading={mutation.isPending}
                    disabled={!items.length || o.dragging}
                    onPress={() => void o.save()}
                />
                <Button
                    title={t('common.cancel')}
                    variant="ghost"
                    disabled={mutation.isPending}
                    onPress={() => router.back()}
                />
            </View>
        </View>
    );
}
