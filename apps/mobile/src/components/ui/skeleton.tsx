import Animated, { useAnimatedStyle, useReducedMotion } from 'react-native-reanimated';
import type { StyleProp, ViewStyle } from 'react-native';
import { cn } from '@/lib/cn';
import { useSkeletonPulse } from './skeleton-pulse';

interface SkeletonProps {
    className?: string;
    style?: StyleProp<ViewStyle>;
}

/**
 * El bloque de carga (Fase 13 §18.2): un rectángulo tenue que late en
 * opacidad mientras llegan los datos — nunca un parpadeo de color (Regla 9
 * §5). Tamaño y forma los pone quien lo usa con `className` (`h-4 w-40`,
 * `rounded-full`…); con movimiento reducido queda estático, sin animación.
 */
export function Skeleton({ className, style }: SkeletonProps) {
    const reduced = useReducedMotion();
    const opacity = useSkeletonPulse();

    const pulse = useAnimatedStyle(() => ({ opacity: opacity.value }));

    return (
        <Animated.View
            testID="skeleton"
            aria-hidden
            className={cn('rounded-lg bg-muted', className)}
            style={[style, pulse, reduced ? { opacity: 0.6 } : null]}
        />
    );
}
