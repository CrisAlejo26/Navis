import { View } from 'react-native';
import { Skeleton } from '@/components/ui/skeleton';
export type TaskSkeletonKind = 'task' | 'habit' | 'series' | 'order' | 'tag';
export function TaskSkeleton({ kind = 'task' }: { kind?: TaskSkeletonKind }) {
    const compact = kind === 'tag',
        actions = kind === 'series' || kind === 'order';
    return (
        <View
            className="mb-3 gap-3 rounded-[26px] border border-border bg-card"
            style={{ padding: 14 }}
        >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 13 }}>
                <Skeleton
                    style={{
                        width: kind === 'order' ? 22 : 42,
                        height: kind === 'order' ? 28 : 42,
                        borderRadius: 15,
                    }}
                />
                <View style={{ flex: 1, gap: 8 }}>
                    <Skeleton style={{ height: 18, width: '80%' }} />
                    {!compact && kind !== 'order' && (
                        <Skeleton style={{ height: 14, width: '95%' }} />
                    )}
                    {kind === 'habit' && <Skeleton style={{ height: 12, width: '35%' }} />}
                    {(kind === 'task' || kind === 'order') && (
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 5 }}>
                            <Skeleton className="h-5 w-16 rounded-full" />
                            <Skeleton className="h-5 w-20 rounded-full" />
                        </View>
                    )}
                </View>
                {kind !== 'series' && (
                    <Skeleton
                        style={{
                            width: compact
                                ? 16
                                : kind === 'habit'
                                  ? 48
                                  : kind === 'order'
                                    ? 26
                                    : 34,
                            height: kind === 'habit' ? 48 : kind === 'order' ? 26 : 12,
                            borderRadius: kind === 'habit' ? 24 : 6,
                            alignSelf: kind === 'habit' || compact ? 'center' : 'flex-start',
                        }}
                    />
                )}
            </View>
            {kind === 'habit' && (
                <View className="gap-2 flex-row flex-wrap">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-5 w-24 rounded-full" />
                    <Skeleton className="h-5 w-16 rounded-full" />
                </View>
            )}
            {kind === 'series' && (
                <>
                    <View className="gap-2 flex-row">
                        <Skeleton className="h-6 w-20 rounded-full" />
                        <Skeleton className="h-6 w-24 rounded-full" />
                    </View>
                    <Skeleton style={{ width: '70%', height: 18 }} />
                </>
            )}
            {actions && (
                <View className="gap-2 flex-row justify-end">
                    <Skeleton
                        style={{
                            width: kind === 'order' ? 44 : 96,
                            height: kind === 'order' ? 44 : 36,
                            borderRadius: 12,
                        }}
                    />
                    <Skeleton
                        style={{
                            width: kind === 'order' ? 44 : 96,
                            height: kind === 'order' ? 44 : 36,
                            borderRadius: 12,
                        }}
                    />
                </View>
            )}
        </View>
    );
}
