import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppBar } from '@/components/ui/app-bar';
import { EmptyState } from '@/components/ui/empty-state';
import { TaskSkeleton } from './task-skeleton';
export function ActivityQueryState({
    title,
    pending,
    error,
    onRetry,
}: {
    title: string;
    pending: boolean;
    error: boolean;
    onRetry: () => void;
}) {
    const { t } = useTranslation();
    return (
        <View className="flex-1 bg-background">
            <AppBar title={title} />
            <View className="px-6 pt-4">
                {pending ? (
                    <>
                        <TaskSkeleton />
                        <TaskSkeleton />
                    </>
                ) : (
                    <EmptyState
                        icon={error ? 'cloud-offline-outline' : 'clipboard-outline'}
                        title={t(error ? 'errors.generic' : 'errors.notFound')}
                        action={error ? { label: t('common.retry'), onPress: onRetry } : undefined}
                    />
                )}
            </View>
        </View>
    );
}
