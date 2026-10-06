import { View } from 'react-native';
import { Skeleton } from '@/components/ui/skeleton';
import { TaskLoading } from './task-loading';
import { TaskSkeletonBlock } from './task-block-skeleton';

export function TagEditorSkeleton() {
    return (
        <TaskLoading>
            <View style={{ gap: 16 }}>
                <View className="gap-4 flex-row items-center">
                    <Skeleton style={{ width: 52, height: 52, borderRadius: 18 }} />
                    <Skeleton style={{ width: '60%', height: 24 }} />
                </View>
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-12 rounded-2xl w-full" />
                <TaskSkeletonBlock>
                    <Skeleton className="h-4 w-24" />
                    <View className="gap-3 flex-row flex-wrap">
                        {Array.from({ length: 8 }, (_, index) => (
                            <Skeleton
                                key={index}
                                style={{ width: 32, height: 32, borderRadius: 16 }}
                            />
                        ))}
                    </View>
                </TaskSkeletonBlock>
                <TaskSkeletonBlock>
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-12 w-full rounded-xl" />
                </TaskSkeletonBlock>
                <Skeleton className="h-12 rounded-2xl w-full" />
            </View>
        </TaskLoading>
    );
}
