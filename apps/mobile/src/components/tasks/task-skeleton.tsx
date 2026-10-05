import { View } from 'react-native';
import { Skeleton } from '@/components/ui/skeleton';
export function TaskSkeleton() {
    return (
        <View className="p-4 mb-3 gap-3 rounded-[26px] bg-card">
            <View className="gap-3 flex-row">
                <Skeleton className="h-11 w-11 rounded-2xl" />
                <View className="gap-2 flex-1">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-28" />
                </View>
            </View>
            <Skeleton className="h-5 w-48 rounded-full" />
        </View>
    );
}
