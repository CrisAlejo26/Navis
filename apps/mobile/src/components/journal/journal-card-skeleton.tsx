import { View } from 'react-native';
import { Skeleton } from '@/components/ui/skeleton';

export function JournalCardSkeleton() {
    return (
        <View
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            className="flex-row gap-[13px] rounded-[26px] border border-border bg-card p-[15px]"
        >
            <Skeleton style={{ width: 42, height: 42, borderRadius: 15 }} />
            <View style={{ flex: 1, gap: 10 }}>
                <Skeleton style={{ width: '80%', height: 18 }} />
                <Skeleton style={{ width: '45%', height: 14 }} />
                <Skeleton style={{ width: '100%', height: 32 }} />
            </View>
        </View>
    );
}
