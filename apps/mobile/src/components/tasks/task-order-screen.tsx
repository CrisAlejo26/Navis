import { useEffect, useRef, useState } from 'react';
import { Alert, FlatList, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { moveInTaskOrder, moveSelectedTasks, type Task } from '@navis/shared';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppBar } from '@/components/ui/app-bar';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { useTaskTemplates, useTaskOrder } from '@/hooks/use-task-series';
import { ActivityQueryState } from './activity-query-state';
import { TaskOrderRow } from './task-order-row';
import { TaskListSkeleton } from './task-loading';
export function TaskOrderScreen() {
    const { t } = useTranslation(),
        insets = useSafeAreaInsets(),
        query = useTaskTemplates(false),
        mutation = useTaskOrder();
    const [items, setItems] = useState<Task[]>([]),
        [selected, setSelected] = useState<string[]>([]),
        [dragging, setDragging] = useState(false);
    const refs = useRef(new Map<string, View>()),
        bounds = useRef(new Map<string, number>());
    useEffect(() => {
        const loaded = query.data?.pages.flatMap((page) => page.items) ?? [];
        setItems((previous) => [
            ...previous,
            ...loaded.filter((task) => !previous.some((row) => row.id === task.id)),
        ]);
    }, [query.data]);
    function start() {
        setDragging(true);
        bounds.current.clear();
        for (const [id, node] of refs.current)
            node.measureInWindow((_x, y, _width, height) => bounds.current.set(id, y + height / 2));
    }
    function drop(from: number, pageY: number) {
        const target = [...bounds.current].sort(
            (a, b) => Math.abs(a[1] - pageY) - Math.abs(b[1] - pageY),
        )[0]?.[0];
        if (target)
            setItems((previous) =>
                moveInTaskOrder(
                    previous,
                    from,
                    previous.findIndex((row) => row.id === target),
                ),
            );
        setDragging(false);
    }
    async function save() {
        try {
            await mutation.mutateAsync({ ids: items.map((task) => task.id) });
            router.replace({ pathname: '/tasks/list', params: { sort: 'manual' } });
        } catch {
            Alert.alert(t('tasks.saveFailed'), t('errors.generic'));
        }
    }
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
                scrollEnabled={!dragging}
                data={items}
                keyExtractor={(task) => task.id}
                contentContainerStyle={{
                    padding: 22,
                    width: '100%',
                    maxWidth: 480,
                    alignSelf: 'center',
                }}
                ListHeaderComponent={
                    <View className="gap-3 pb-4">
                        <Text className="font-sans text-sm text-muted-foreground">
                            {t('tasks.orderHint')}
                        </Text>
                        {selected.length > 0 && (
                            <View className="gap-2 flex-row flex-wrap">
                                {([-1, 1] as const).map((direction) => (
                                    <Button
                                        key={direction}
                                        title={t(
                                            direction === -1 ? 'tasks.orderUp' : 'tasks.orderDown',
                                        )}
                                        size="sm"
                                        variant="outline"
                                        disabled={mutation.isPending}
                                        onPress={() =>
                                            setItems((previous) =>
                                                moveSelectedTasks(previous, selected, direction),
                                            )
                                        }
                                    />
                                ))}
                            </View>
                        )}
                    </View>
                }
                renderItem={({ item, index }) => (
                    <TaskOrderRow
                        task={item}
                        index={index}
                        total={items.length}
                        selected={selected.includes(item.id)}
                        busy={mutation.isPending}
                        select={() =>
                            setSelected((ids) =>
                                ids.includes(item.id)
                                    ? ids.filter((id) => id !== item.id)
                                    : [...ids, item.id],
                            )
                        }
                        move={(to) => setItems((previous) => moveInTaskOrder(previous, index, to))}
                        start={start}
                        drop={(y) => drop(index, y)}
                        cancel={() => setDragging(false)}
                        rowRef={(node) => {
                            if (node) refs.current.set(item.id, node);
                            else refs.current.delete(item.id);
                        }}
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
                            loading={query.isFetchingNextPage}
                            onPress={() => void query.fetchNextPage()}
                        />
                    ) : null
                }
            />
            <View className="gap-2 pt-3 px-[22px]" style={{ paddingBottom: insets.bottom + 14 }}>
                <Button
                    title={t('common.save')}
                    loading={mutation.isPending}
                    disabled={!items.length || dragging}
                    onPress={() => void save()}
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
