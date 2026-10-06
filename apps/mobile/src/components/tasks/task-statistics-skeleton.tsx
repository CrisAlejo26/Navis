import { View, useWindowDimensions } from 'react-native';
import { Skeleton } from '@/components/ui/skeleton';
import { TaskLoading } from './task-loading';
import { TaskSkeletonBlock, TaskStreakSkeleton } from './task-block-skeleton';

function BreakdownSkeleton() {
    return (
        <TaskSkeletonBlock>
            <Skeleton className="h-4 w-36" />
            {[0, 1, 2].map((row) => (
                <View key={row} className="flex-row justify-between">
                    <Skeleton className="h-5 w-28" />
                    <Skeleton className="h-5 w-8" />
                </View>
            ))}
        </TaskSkeletonBlock>
    );
}
function ChartSkeleton({ bars = false }: { bars?: boolean }) {
    return (
        <TaskSkeletonBlock>
            <Skeleton className="h-4 w-36" />
            <View
                className="gap-2 flex-row items-end border-b border-border"
                style={{ height: 150, paddingBottom: 8 }}
            >
                {bars ? (
                    [52, 88, 66, 120, 78, 106, 58].map((height, index) => (
                        <View key={index} style={{ flex: 1, alignItems: 'center', gap: 8 }}>
                            <Skeleton style={{ height, width: '65%' }} />
                            <Skeleton className="h-2 w-5" />
                        </View>
                    ))
                ) : (
                    <Skeleton style={{ width: '100%', height: 130 }} />
                )}
            </View>
            <Skeleton className="h-3 w-40" />
        </TaskSkeletonBlock>
    );
}
export function TaskStatisticsSkeleton() {
    const { fontScale } = useWindowDimensions();
    return (
        <TaskLoading>
            <View style={{ gap: 22 }}>
                <View
                    className="gap-4 rounded-[32px] border border-border bg-card"
                    style={{ padding: 22 }}
                >
                    <Skeleton className="h-4 w-36" />
                    <View
                        style={{
                            flexDirection: 'row',
                            flexWrap: 'wrap',
                            gap: 16,
                            alignItems: 'center',
                        }}
                    >
                        <View style={{ flex: 1, minWidth: 150, gap: 12 }}>
                            <Skeleton className="h-6 w-36" />
                            <View className="gap-4 flex-row">
                                <Skeleton className="h-10 w-16" />
                                <Skeleton className="h-10 w-16" />
                            </View>
                        </View>
                        <Skeleton style={{ width: 92, height: 92, borderRadius: 46 }} />
                    </View>
                </View>
                <Skeleton className="h-12 rounded-2xl w-full" />
                <View className="gap-2 items-center">
                    <Skeleton className="h-16 w-28" />
                    <Skeleton className="h-4 w-44" />
                    <Skeleton className="h-3 w-32" />
                </View>
                <ChartSkeleton bars />
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                    {[0, 1, 2, 3].map((metric) => (
                        <View
                            key={metric}
                            className="gap-2 rounded-[26px] border border-border bg-card"
                            style={{
                                flexGrow: 1,
                                flexBasis: '45%',
                                minWidth: 130 * fontScale,
                                padding: 16,
                            }}
                        >
                            <Skeleton className="h-10 w-10 rounded-xl" />
                            <Skeleton className="h-8 w-16" />
                            <Skeleton style={{ width: '85%', height: 16 }} />
                        </View>
                    ))}
                </View>
                <TaskStreakSkeleton />
                <BreakdownSkeleton />
                <BreakdownSkeleton />
                <ChartSkeleton />
                <TaskSkeletonBlock>
                    <Skeleton className="h-4 w-36" />
                    <View className="flex-row flex-wrap gap-[5px]">
                        {Array.from({ length: 90 }, (_, day) => (
                            <Skeleton
                                key={day}
                                style={{ width: 14, height: 14, borderRadius: 4 }}
                            />
                        ))}
                    </View>
                    <Skeleton className="h-3 w-40" />
                </TaskSkeletonBlock>
            </View>
        </TaskLoading>
    );
}
