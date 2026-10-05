import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { EmptyState } from '@/components/ui/empty-state';
import { defaultFilters } from '@/lib/tasks/filters';
import { TaskSkeleton } from './task-skeleton';
import type { TaskDirectoryState } from './use-task-directory';
export function TaskDirectoryEmpty({ state: s }: { state: TaskDirectoryState }) {
    const { t } = useTranslation();
    return s.listing.isPending || s.exists.isPending ? (
        <View className="pt-4">
            <TaskSkeleton />
            <TaskSkeleton />
            <TaskSkeleton />
        </View>
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
                    : undefined
            }
        />
    );
}
