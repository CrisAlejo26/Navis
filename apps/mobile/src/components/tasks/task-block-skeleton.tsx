import type { ReactNode } from 'react';
import { View, useWindowDimensions } from 'react-native';
import { buildDateGrid } from '@/lib/ui/date-grid';
import { Skeleton } from '@/components/ui/skeleton';
import { TaskLoading } from './task-loading';

export function TaskSkeletonBlock({ children }: { children: ReactNode }) {
    return (
        <View className="gap-3 rounded-[26px] border border-border bg-card" style={{ padding: 15 }}>
            {children}
        </View>
    );
}
export function TaskStreakSkeleton() {
    return (
        <TaskLoading>
            <TaskSkeletonBlock>
                <Skeleton className="h-4 w-20" />
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 13 }}>
                    <Skeleton style={{ width: 44, height: 60, borderRadius: 12 }} />
                    <View style={{ flex: 1, gap: 8 }}>
                        <Skeleton className="h-5 w-20" />
                        <Skeleton style={{ height: 28, width: '95%' }} />
                    </View>
                </View>
                <View style={{ flexDirection: 'row', gap: 5 }}>
                    {Array.from({ length: 14 }, (_, index) => (
                        <Skeleton key={index} style={{ width: 16, height: 16, borderRadius: 8 }} />
                    ))}
                </View>
            </TaskSkeletonBlock>
        </TaskLoading>
    );
}
export function TaskCalendarSkeleton({ month }: { month?: string }) {
    const { fontScale } = useWindowDimensions();
    const weeks = month ? buildDateGrid(month).weeks.length : 6;
    return (
        <View style={{ marginTop: 18, marginBottom: 4 }}>
            <TaskLoading>
                <TaskSkeletonBlock>
                    <View className="flex-row items-center justify-between">
                        <Skeleton className="h-8 w-8" />
                        <Skeleton className="h-5 w-36" />
                        <Skeleton className="h-8 w-8" />
                    </View>
                    <View className="gap-1">
                        <View style={{ flexDirection: 'row' }}>
                            {Array.from({ length: 7 }, (_, index) => (
                                <View key={index} style={{ flex: 1, alignItems: 'center' }}>
                                    <Skeleton className="h-3 w-5" />
                                </View>
                            ))}
                        </View>
                        {Array.from({ length: weeks }, (_, row) => (
                            <View key={row} style={{ flexDirection: 'row' }}>
                                {Array.from({ length: 7 }, (_, column) => (
                                    <View
                                        key={column}
                                        style={{
                                            flex: 1,
                                            height: 48 * Math.max(1, fontScale),
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}
                                    >
                                        <Skeleton
                                            style={{ width: 28, height: 28, borderRadius: 14 }}
                                        />
                                    </View>
                                ))}
                            </View>
                        ))}
                    </View>
                    <View className="gap-3 flex-row justify-center">
                        <Skeleton className="h-3 w-24" />
                        <Skeleton className="h-3 w-24" />
                    </View>
                </TaskSkeletonBlock>
            </TaskLoading>
        </View>
    );
}
