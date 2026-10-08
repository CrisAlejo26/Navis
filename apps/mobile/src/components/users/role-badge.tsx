import { Text, View } from 'react-native';

import { hexAlpha, readableAccent } from '@/lib/color';
import { useUserPalette } from './user-theme';

/** El rol como pastilla: punto y fondo del color, texto en la tinta que se lee sobre él. */
export function RoleBadge({ label, color }: { label: string; color: string }) {
    const p = useUserPalette();
    const ink = readableAccent(color, p.card, p.foreground, 0.14);
    return (
        <View
            className="flex-row items-center self-start"
            style={{
                gap: 6,
                borderRadius: 999,
                paddingVertical: 4,
                paddingHorizontal: 10,
                backgroundColor: hexAlpha(color, 0.14),
            }}
        >
            <View
                aria-hidden
                style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: color }}
            />
            <Text className="font-sans-semibold text-xs" style={{ color: ink }} numberOfLines={1}>
                {label}
            </Text>
        </View>
    );
}
