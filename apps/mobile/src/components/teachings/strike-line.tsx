import { themeColorsHex } from '@navis/theme';
import { useEffect } from 'react';
import Animated, {
    useAnimatedStyle,
    useReducedMotion,
    useSharedValue,
    withDelay,
    withTiming,
} from 'react-native-reanimated';

import { useThemeStore } from '@/lib/theme';

interface StrikeLineProps {
    x: number;
    y: number;
    width: number;
    checked: boolean;
    /** Para que las líneas de un texto largo se tachen una tras otra. */
    delay: number;
}

const THICKNESS = 1.5;

/**
 * El trazo que tacha una línea de una tarea al marcarla: la firma de la
 * sección (RFC 0022 §3). Solo se anima `transform` —`scaleX` de 0 a 1 desde la
 * izquierda—, nunca `width`, que el compositor no sabe resolver; y con
 * «reducir movimiento» el trazo aparece ya dibujado.
 */
export function StrikeLine({ x, y, width, checked, delay }: StrikeLineProps) {
    const palette = themeColorsHex[useThemeStore((state) => state.resolvedTheme)];
    const reduced = useReducedMotion();
    const progress = useSharedValue(checked ? 1 : 0);

    useEffect(() => {
        const target = checked ? 1 : 0;
        progress.value = reduced
            ? target
            : withDelay(checked ? delay : 0, withTiming(target, { duration: checked ? 240 : 140 }));
    }, [checked, delay, progress, reduced]);

    const style = useAnimatedStyle(() => ({ transform: [{ scaleX: progress.value }] }));

    return (
        <Animated.View
            pointerEvents="none"
            style={[
                {
                    position: 'absolute',
                    left: x,
                    top: y - THICKNESS / 2,
                    width,
                    height: THICKNESS,
                    borderRadius: THICKNESS,
                    backgroundColor: palette.mutedForeground,
                    transformOrigin: 'left center',
                },
                style,
            ]}
        />
    );
}
