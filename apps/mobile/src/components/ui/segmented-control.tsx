import { themeColorsHex } from '@navis/theme';
import { useEffect, useState } from 'react';
import { Pressable, Text, View, type LayoutChangeEvent } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { cn } from '@/lib/cn';
import { useThemeStore } from '@/lib/theme';

const HEIGHT = 40;
const SPRING = { stiffness: 240, damping: 24 };

interface SegmentedControlProps<T extends string> {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}

/**
 * 2-4 opciones visibles, con la pastilla que se desliza — la misma firma que
 * ya usa `AnimatedTabBar` (Regla 9 §7: se reutiliza el gesto, no el fichero,
 * porque aquí las opciones son genéricas y allí son rutas fijas).
 */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: SegmentedControlProps<T>) {
  const palette = themeColorsHex[useThemeStore((state) => state.resolvedTheme)];
  const reducedMotion = useReducedMotion();
  const [containerWidth, setContainerWidth] = useState(0);
  const index = Math.max(
    0,
    options.findIndex((option) => option.value === value),
  );
  const pillX = useSharedValue(index);

  useEffect(() => {
    pillX.value = index;
  }, [index, pillX]);

  const segmentWidth = containerWidth / options.length;
  const pillStyle = useAnimatedStyle(() => {
    const x = pillX.value * segmentWidth;
    return { transform: [{ translateX: reducedMotion ? x : withSpring(x, SPRING) }] };
  }, [segmentWidth, reducedMotion]);

  const onLayout = (event: LayoutChangeEvent) => setContainerWidth(event.nativeEvent.layout.width);

  return (
    <View
      className="p-1 relative flex-row rounded-lg bg-muted"
      style={{ height: HEIGHT }}
      onLayout={onLayout}
    >
      {segmentWidth > 0 ? (
        <Animated.View
          style={[
            pillStyle,
            {
              position: 'absolute',
              top: 4,
              left: 4,
              width: segmentWidth - 8,
              height: HEIGHT - 8,
              borderRadius: 8,
              backgroundColor: palette.card,
            },
          ]}
        />
      ) : null}
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => onChange(option.value)}
            className="flex-1 items-center justify-center"
          >
            <Text
              className={cn(
                'text-sm font-sans',
                selected ? 'font-sans-semibold text-foreground' : 'text-muted-foreground',
              )}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
