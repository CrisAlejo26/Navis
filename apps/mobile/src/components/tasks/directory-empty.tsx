import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { EmptyState } from '@/components/ui/empty-state';
import { defaultFilters } from '@/lib/tasks/filters';
import { TaskListSkeleton } from './task-loading';
import type { TaskDirectoryState } from './use-task-directory';
export function TaskDirectoryEmpty({ state: s }: { state: TaskDirectoryState }) {
    const { t } = useTranslation();
    return s.listing.isPending || s.exists.isPending ? (
        <TaskListSkeleton
            kind={s.filters.type === 'habit' ? 'habit' : 'task'}
            section={s.filters.group !== 'none'}
        />
    ) : s.listing.isError || s.exists.isError ? (
        <EmptyState
            icon="cloud-offline-outline"
            title={t('errors.generic')}
            action={{
                label: t('common.retry'),
                onPress: () => {
                    void s.listing.refetch();
                    void s.exists.refetch();
                },
            }}
        />
    ) : (
        <EmptyState
            icon={s.exists.data ? 'funnel-outline' : 'clipboard-outline'}
            title={t(s.exists.data ? 'tasks.emptyTasks' : 'tasks.mobile.emptyTitle')}
            description={t(
                s.exists.data ? 'tasks.mobile.emptyFilteredHint' : 'tasks.mobile.emptyHint',
            )}
            action={
                s.exists.data
                    ? {
                          label: t('tasks.mobile.reset'),
                          onPress: () => {
                              s.setFilters(defaultFilters());
                              s.setView('list');
                          },
                      }
                    : { label: t('tasks.add'), onPress: () => router.push('/tasks/edit') }
            }
        />
    );
}
