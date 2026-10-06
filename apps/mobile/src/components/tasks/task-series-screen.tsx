import { Alert, FlatList, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { todayIn } from '@navis/shared';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useListContext } from '@/hooks/use-lists';
import { useTaskTemplates, useTaskSeriesAction } from '@/hooks/use-task-series';
import { AppBar } from '@/components/ui/app-bar';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import { ActivityQueryState } from './activity-query-state';
import { TaskSeriesCard } from './task-series-card';
import { TaskListSkeleton } from './task-loading';
export function TaskSeriesScreen() {
    const { t } = useTranslation(),
        scope = useListContext(),
        insets = useSafeAreaInsets();
    const today = todayIn(scope.church?.timezone ?? 'UTC'),
        query = useTaskTemplates(true),
        mutation = useTaskSeriesAction();
    const edit = (id: string) =>
        router.push({ pathname: '/tasks/edit', params: { kind: 'task', id } });
    async function change(id: string, action: 'pause' | 'resume' | 'finish') {
        try {
            await mutation.mutateAsync({ id, action, date: today });
        } catch {
            Alert.alert(t('tasks.saveFailed'), t('errors.generic'));
        }
    }
    function action(id: string, value: 'pause' | 'resume' | 'finish') {
        if (value !== 'finish') {
            void change(id, value);
            return;
        }
        Alert.alert(t('tasks.seriesFinish'), t('tasks.seriesFinishConfirm'), [
            { text: t('common.cancel'), style: 'cancel' },
            {
                text: t('tasks.seriesFinish'),
                style: 'destructive',
                onPress: () => void change(id, value),
            },
        ]);
    }
    if (query.isPending || query.isError)
        return (
            <ActivityQueryState
                title={t('tasks.series')}
                layout="series"
                pending={query.isPending}
                error={query.isError}
                onRetry={() => void query.refetch()}
            />
        );
    return (
        <View className="flex-1 bg-background">
            <AppBar title={t('tasks.series')} />
            <FlatList
                data={query.data.pages.flatMap((page) => page.items)}
                keyExtractor={(task) => task.id}
                contentContainerStyle={{
                    padding: 22,
                    paddingBottom: insets.bottom + 24,
                    width: '100%',
                    maxWidth: 480,
                    alignSelf: 'center',
                }}
                renderItem={({ item }) => (
                    <TaskSeriesCard
                        task={item}
                        today={today}
                        busy={mutation.isPending}
                        edit={() => edit(item.id)}
                        action={(value) => action(item.id, value)}
                    />
                )}
                ListEmptyComponent={
                    <EmptyState
                        icon="repeat-outline"
                        title={t('tasks.noTasks')}
                        action={{
                            label: t('tasks.add'),
                            onPress: () => router.push('/tasks/edit'),
                        }}
                    />
                }
                ListFooterComponent={
                    query.isFetchingNextPage ? (
                        <TaskListSkeleton kind="series" count={2} />
                    ) : query.hasNextPage ? (
                        <Button
                            title={t('notes.loadMore')}
                            variant="outline"
                            loading={query.isFetchingNextPage}
                            onPress={() => void query.fetchNextPage()}
                        />
                    ) : null
                }
            />
        </View>
    );
}
