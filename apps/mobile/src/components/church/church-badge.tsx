import { Ionicons } from '@expo/vector-icons';
import { churchEmblem } from '@navis/shared';
import { themeColorsHex } from '@navis/theme';
import { View } from 'react-native';
import Animated, { FadeIn, useReducedMotion } from 'react-native-reanimated';
import { CHURCH_NATIVE_ICONS } from '@/lib/church-icon';
import { useThemeStore } from '@/lib/theme';

export function ChurchBadge({ id, muted = false }: { id: string; muted?: boolean }) {
    const { icon, tint } = churchEmblem(id);
    const palette = themeColorsHex[useThemeStore((state) => state.resolvedTheme)];
    const reduced = useReducedMotion();
    const color = muted ? palette.mutedForeground : palette[`church${tint}Foreground`];
    const backgroundColor = muted ? palette.muted : palette[`church${tint}`];
    return (
        <Animated.View
            key={id}
            entering={reduced ? undefined : FadeIn.duration(120)}
            accessible={false}
        >
            <View
                className="h-8 w-8 items-center justify-center rounded-lg"
                style={{ backgroundColor }}
            >
                <Ionicons name={CHURCH_NATIVE_ICONS[icon]} size={20} color={color} />
            </View>
        </Animated.View>
    );
}
