import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { AppBar } from '@/components/ui/app-bar';
import { EmptyState } from '@/components/ui/empty-state';
import { TaskListSkeleton, TaskLoading } from './task-loading';
import { ActivityScreenSkeleton } from './activity-screen-skeleton';
import { Skeleton } from '@/components/ui/skeleton';
import { TagEditorSkeleton } from './tag-editor-skeleton';
export type ActivityLoadingLayout = 'detail' | 'editor' | 'series' | 'order' | 'tag' | 'tag-editor';
export function ActivityQueryState({
    title,
    pending,
    error,
    onRetry,
    layout = 'detail',
}: {
    title: string;
    pending: boolean;
    error: boolean;
    onRetry: () => void;
    layout?: ActivityLoadingLayout;
}) {
    const { t } = useTranslation();
    const insets = useSafeAreaInsets();
    return (
        <View className="flex-1 bg-background">
            <AppBar title={title} />
            <ScrollView
                contentContainerStyle={{
                    padding: 22,
                    paddingBottom: insets.bottom + 24,
                    width: '100%',
                    maxWidth: 480,
                    alignSelf: 'center',
                }}
            >
                {pending && (layout === 'order' || layout === 'tag') && (
                    <View className="gap-3 mb-4">
                        <TaskLoading className="gap-3">
                            {layout === 'tag' && <Skeleton className="h-8 w-32" />}
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-44" />
                            {layout === 'tag' && <Skeleton className="h-12 rounded-2xl w-full" />}
                        </TaskLoading>
                    </View>
                )}
                {pending ? (
                    layout === 'tag-editor' ? (
                        <TagEditorSkeleton />
                    ) : layout === 'detail' || layout === 'editor' ? (
                        <ActivityScreenSkeleton editor={layout === 'editor'} />
                    ) : (
                        <TaskListSkeleton kind={layout} />
                    )
                ) : (
                    <EmptyState
                        icon={error ? 'cloud-offline-outline' : 'clipboard-outline'}
                        title={t(error ? 'errors.generic' : 'errors.notFound')}
                        action={error ? { label: t('common.retry'), onPress: onRetry } : undefined}
                    />
                )}
            </ScrollView>
            {pending && (layout === 'order' || layout === 'editor' || layout === 'tag-editor') && (
                <View
                    className="gap-2 pt-3 px-[22px]"
                    style={{ paddingBottom: insets.bottom + 14 }}
                >
                    <TaskLoading>
                        <View className="gap-2">
                            <Skeleton className="h-12 rounded-2xl w-full" />
                            {layout === 'order' && <Skeleton className="h-10 rounded-2xl w-full" />}
                        </View>
                    </TaskLoading>
                </View>
            )}
        </View>
    );
}
