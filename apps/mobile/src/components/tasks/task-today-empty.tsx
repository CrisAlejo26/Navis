import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { EmptyState } from '@/components/ui/empty-state';
import { TaskSkeleton } from './task-skeleton';
import type { TaskTodayState } from './use-task-today';

export function TaskTodayEmpty({ state: s }: { state: TaskTodayState }) {
    const { t } = useTranslation();
    if (s.listing.isPending) return <TaskSkeleton />;
    const filtered = s.filter !== 'all';
    return (
        <EmptyState
            icon={s.listing.isError ? 'cloud-offline-outline' : 'checkmark-done-outline'}
            title={t(
                s.listing.isError
                    ? 'errors.generic'
                    : filtered
                      ? s.kind === 'task'
                          ? 'tasks.emptyTasks'
                          : 'tasks.emptyHabits'
                      : 'tasks.emptyToday',
            )}
            description={s.listing.isError || filtered ? undefined : t('tasks.emptyTodayHint')}
            action={
                s.listing.isError
                    ? { label: t('common.retry'), onPress: () => void s.listing.refetch() }
                    : filtered
                      ? { label: t('tasks.mobile.reset'), onPress: () => s.setFilter('all') }
                      : {
                            label: t(s.kind === 'habit' ? 'tasks.addHabit' : 'tasks.add'),
                            onPress: () =>
                                router.push({
                                    pathname: '/tasks/edit',
                                    params: { kind: s.kind, date: s.day },
                                }),
                        }
            }
        />
    );
}
