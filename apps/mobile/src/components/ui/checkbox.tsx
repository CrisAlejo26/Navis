import { Ionicons } from '@expo/vector-icons';
import { themeColorsHex } from '@navis/theme';
import { Pressable, View } from 'react-native';

import { ControlRow } from '@/components/ui/control-row';
import { cn } from '@/lib/cn';
import { useThemeStore } from '@/lib/theme';

interface CheckboxProps {
    label: string;
    description?: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
    disabled?: boolean;
    compact?: boolean;
}

function CheckboxGlyph({ checked }: { checked: boolean }) {
    const palette = themeColorsHex[useThemeStore((state) => state.resolvedTheme)];

    return (
        <View
            className={cn(
                'h-5 w-5 items-center justify-center rounded-md border-2',
                checked ? 'border-primary bg-primary' : 'border-input',
            )}
        >
            {checked ? (
                <Ionicons name="checkmark" size={14} color={palette.primaryForeground} />
            ) : null}
        </View>
    );
}

/** Casilla con etiqueta a la derecha — Fase 6. */
export function Checkbox({
    label,
    description,
    checked,
    onChange,
    disabled = false,
    compact = false,
}: CheckboxProps) {
    if (compact)
        return (
            <Pressable
                accessibilityRole="checkbox"
                accessibilityLabel={label}
                accessibilityState={{ checked, disabled }}
                disabled={disabled}
                onPress={() => onChange(!checked)}
                className="h-12 w-12 items-center justify-center"
            >
                <CheckboxGlyph checked={checked} />
            </Pressable>
        );
    return (
        <ControlRow
            label={label}
            description={description}
            accessibilityRole="checkbox"
            checked={checked}
            disabled={disabled}
            onPress={() => onChange(!checked)}
            control={<CheckboxGlyph checked={checked} />}
        />
    );
}
