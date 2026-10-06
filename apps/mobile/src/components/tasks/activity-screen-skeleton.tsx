import { View } from 'react-native';
import { Skeleton } from '@/components/ui/skeleton';
import { TaskLoading } from './task-loading';
import { TaskSkeletonBlock } from './task-block-skeleton';

export function ActivityScreenSkeleton({ editor = false }: { editor?: boolean }) {
    return (
        <TaskLoading>
            <View style={{ gap: 16 }}>
                {editor ? (
                    <>
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-12 rounded-2xl w-full" />
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-24 rounded-2xl w-full" />
                    </>
                ) : (
                    <View style={{ gap: 16 }}>
                        <Skeleton style={{ width: 52, height: 52, borderRadius: 15 }} />
                        <Skeleton style={{ width: '80%', height: 28 }} />
                        <View className="gap-2 flex-row flex-wrap">
                            <Skeleton className="h-6 w-24 rounded-full" />
                            <Skeleton className="h-6 w-16 rounded-full" />
                            <Skeleton className="h-6 w-16 rounded-full" />
                        </View>
                    </View>
                )}
                {[0, 1, 2, 3].map((block) => (
                    <TaskSkeletonBlock key={block}>
                        <Skeleton className="h-4 w-24" />
                        {editor ? (
                            <Skeleton className="h-12 w-full rounded-xl" />
                        ) : (
                            <>
                                <Skeleton style={{ width: '90%', height: 18 }} />
                                <Skeleton style={{ width: '65%', height: 14 }} />
                            </>
                        )}
                    </TaskSkeletonBlock>
                ))}
                {!editor && (
                    <>
                        <Skeleton className="h-12 rounded-2xl w-full" />
                        <Skeleton className="h-10 rounded-2xl w-full" />
                    </>
                )}
            </View>
        </TaskLoading>
    );
}
