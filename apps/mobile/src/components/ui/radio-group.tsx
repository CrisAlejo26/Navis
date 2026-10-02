import { View } from 'react-native';
import { useEffect } from 'react';
import { themeColorsHex } from '@navis/theme';
import Animated, {
    interpolateColor,
    useAnimatedStyle,
    useReducedMotion,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';

import { ControlRow } from '@/components/ui/control-row';
import { FieldError } from '@/components/ui/field-error';
import { useThemeStore } from '@/lib/theme';

export interface RadioOption<T extends string> {
    value: T;
    label: string;
    description?: string;
}

interface RadioGroupProps<T extends string> {
    options: RadioOption<T>[];
    value: T;
    error?: string;
    onChange: (value: T) => void;
    disabled?: boolean;
}

function RadioGlyph({ selected }: { selected: boolean }) {
    const palette = themeColorsHex[useThemeStore((state) => state.resolvedTheme)];
    const reducedMotion = useReducedMotion();
    const progress = useSharedValue(selected ? 1 : 0);
    useEffect(() => {
        progress.value = reducedMotion
            ? Number(selected)
            : withTiming(Number(selected), { duration: 180 });
    }, [selected, reducedMotion, progress]);
    const ring = useAnimatedStyle(() => ({
        borderColor: interpolateColor(progress.value, [0, 1], [palette.border, palette.primary]),
    }));
    const dot = useAnimatedStyle(() => ({
        opacity: progress.value,
        transform: [{ scale: 0.6 + progress.value * 0.4 }],
    }));
    return (
        <Animated.View
            className="h-5 w-5 items-center justify-center rounded-full border-2"
            style={ring}
        >
            <Animated.View className="h-2.5 w-2.5 rounded-full bg-primary" style={dot} />
        </Animated.View>
    );
}

/** Selección única, gestionada por el propio grupo — Fase 6. */
export function RadioGroup<T extends string>({
    options,
    value,
    error,
    onChange,
    disabled = false,
}: RadioGroupProps<T>) {
    return (
        <View className="gap-1">
            <View accessibilityRole="radiogroup">
                {options.map((option) => (
                    <ControlRow
                        key={option.value}
                        label={option.label}
                        description={option.description}
                        accessibilityRole="radio"
                        selected={option.value === value}
                        disabled={disabled}
                        onPress={() => onChange(option.value)}
                        control={<RadioGlyph selected={option.value === value} />}
                    />
                ))}
            </View>
            {error ? <FieldError message={error} /> : null}
        </View>
    );
}
