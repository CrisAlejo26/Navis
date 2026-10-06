import { Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { TaskListSkeleton } from './task-loading';
import type { TaskDirectoryState } from './use-task-directory';
export function TaskDirectoryFooter({ state: s }: { state: TaskDirectoryState }) {
    const { t } = useTranslation();
    if (s.listing.isFetchingNextPage)
        return <TaskListSkeleton kind={s.filters.type === 'habit' ? 'habit' : 'task'} count={2} />;
    if (s.listing.isError && s.items.length > 0)
        return (
            <>
                <Text accessibilityRole="alert" className="font-sans text-destructive">
                    {t('errors.generic')}
                </Text>
                <Button title={t('common.retry')} onPress={() => void s.listing.refetch()} />
            </>
        );
    if (s.listing.hasNextPage)
        return (
            <Button
                title={t('notes.loadMore')}
                variant="ghost"
                onPress={() => void s.listing.fetchNextPage()}
            />
        );
    return null;
}
