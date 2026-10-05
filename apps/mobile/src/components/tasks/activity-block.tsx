import { Text, View } from 'react-native';
import type { ReactNode } from 'react';
import { useTaskPalette } from './task-theme';
import { listCardShadow } from '@/lib/ui/elevation';
export function ActivityBlock({ title, children }: { title: string; children: ReactNode }) {
    const p = useTaskPalette();
    return (
        <View
            style={{
                borderRadius: 26,
                padding: 16,
                gap: 12,
                backgroundColor: p.card,
                ...listCardShadow(p.primary, p.dark),
            }}
        >
            <Text className="font-sans-semibold text-xs tracking-wide text-muted-foreground uppercase">
                {title}
            </Text>
            {children}
        </View>
    );
}
