import type { ReactNode } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Skeleton } from '@/components/ui/skeleton';
import { SkeletonGroup } from '@/components/ui/skeleton-pulse';
import { TaskSkeleton, type TaskSkeletonKind } from './task-skeleton';

/** Announce loading once per block; placeholders are not controls. */
export function TaskLoading({ children, className }: { children: ReactNode; className?: string }) {
    const { t } = useTranslation();
    return (
        <View
            className={className}
            accessible
            accessibilityLabel={t('common.loading')}
            accessibilityState={{ busy: true }}
            pointerEvents="none"
            testID="tasks-loading"
        >
            <SkeletonGroup>{children}</SkeletonGroup>
        </View>
    );
}
export function TaskListSkeleton({
    kind = 'task',
    section = false,
    count = 3,
}: {
    kind?: TaskSkeletonKind;
    section?: boolean;
    count?: number;
}) {
    return (
        <TaskLoading>
            {section && (
                <View className="py-4 flex-row justify-between">
                    <Skeleton className="h-5 w-28" />
                    <Skeleton className="h-4 w-4" />
                </View>
            )}
            {Array.from({ length: count }, (_, index) => (
                <TaskSkeleton key={index} kind={kind} />
            ))}
        </TaskLoading>
    );
}
export function TaskChipsSkeleton({ count = 3 }: { count?: number }) {
    return (
        <TaskLoading>
            <View className="gap-2 flex-row flex-wrap">
                {Array.from({ length: count }, (_, index) => (
                    <Skeleton
                        key={index}
                        style={{ width: [80, 112, 96][index % 3], height: 44, borderRadius: 16 }}
                    />
                ))}
            </View>
        </TaskLoading>
    );
}
