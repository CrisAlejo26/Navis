import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useEffect } from 'react';
import { cn } from '@/lib/cn';

interface SkeletonProps {
  className?: string;
}

/**
 * El bloque de carga (Fase 13 §18.2): un rectángulo tenue que late en
 * opacidad mientras llegan los datos — nunca un parpadeo de color (Regla 9
 * §5). Tamaño y forma los pone quien lo usa con `className` (`h-4 w-40`,
 * `rounded-full`…); con movimiento reducido queda estático, sin animación.
 */
export function Skeleton({ className }: SkeletonProps) {
  const reduced = useReducedMotion();
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (!reduced) {
      opacity.value = withRepeat(withTiming(0.5, { duration: 800 }), -1, true);
    }
  }, [reduced, opacity]);

  const pulse = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      testID="skeleton"
      aria-hidden
      className={cn('rounded-lg bg-muted', className)}
      style={[pulse, reduced ? { opacity: 0.6 } : null]}
    />
  );
}
