import { FlatList, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TaskTodayEmpty } from './task-today-empty';
import { TaskNavigation } from './task-navigation';
import { TaskAppBar } from './task-app-bar';
import { TaskTodayHeader } from './task-today-header';
import { HabitTodayCard } from './habit-today-card';
import { TaskCard } from './task-card';
import { Button } from '@/components/ui/button';
import { useTaskToday } from './use-task-today';
import { activityId, activityKey, activityKind, type ActivityItem } from '@/lib/tasks/filters';

export function TaskTodayScreen() {
    const s = useTaskToday(),
        { t } = useTranslation(),
        insets = useSafeAreaInsets();
    const open = (item: ActivityItem) =>
        router.push({
            pathname: '/tasks/detail',
            params: { id: activityId(item), kind: activityKind(item), date: item.date },
        });
    return (
        <View className="flex-1 bg-background">
            <TaskAppBar title={t('tasks.title')} date={s.day} />
            <TaskNavigation active="today" />
            <FlatList
                data={s.items}
                keyExtractor={activityKey}
                initialNumToRender={10}
                contentContainerStyle={{
                    paddingHorizontal: 22,
                    paddingBottom: insets.bottom + 24,
                    width: '100%',
                    maxWidth: 480,
                    alignSelf: 'center',
                }}
                ListHeaderComponent={<TaskTodayHeader state={s} />}
                ListEmptyComponent={<TaskTodayEmpty state={s} />}
                ListFooterComponent={
                    s.listing.isError && s.items.length ? (
                        <Button
                            title={t('common.retry')}
                            onPress={() => void s.listing.refetch()}
                        />
                    ) : null
                }
                renderItem={({ item }) =>
                    'habitId' in item ? (
                        <HabitTodayCard
                            item={item}
                            busy={s.action.isPending}
                            onPress={() => open(item)}
                            onToggle={() => void s.toggle(item)}
                        />
                    ) : (
                        <TaskCard
                            item={item}
                            busy={s.action.isPending}
                            onPress={() => open(item)}
                            onToggle={() => void s.toggle(item)}
                            onDelete={() => s.remove(item)}
                        />
                    )
                }
            />
        </View>
    );
}
