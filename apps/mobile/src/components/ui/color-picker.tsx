import { ACCENT_PALETTE, CONGREGATION_ACCENTS } from '@navis/shared';
import { accentHex } from '@navis/theme';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';
import { useThemeStore } from '@/lib/theme';
import { readableInk } from '@/lib/lists/readable-ink';
import { TextField } from './text-field';

const COLORS = [...CONGREGATION_ACCENTS, ...ACCENT_PALETTE];

/** Las mismas muestras y valores hexadecimales que el selector web. */
export function ColorPicker({
    value,
    onChange,
    label,
    disabled = false,
}: {
    value: string;
    onChange: (color: string) => void;
    label: string;
    disabled?: boolean;
}) {
    const { t } = useTranslation();
    const theme = useThemeStore((state) => state.resolvedTheme);
    const [custom, setCustom] = useState(value.startsWith('#') ? value : '');
    const samples =
        COLORS.includes(value as (typeof COLORS)[number]) || !value.startsWith('#')
            ? COLORS
            : [...COLORS, value];
    return (
        <View className="gap-3">
            <Text className="text-sm font-sans-medium text-foreground">{label}</Text>
            <View className="gap-2 flex-row flex-wrap" accessibilityRole="radiogroup">
                {samples.map((color, index) => {
                    const hex = accentHex(color, theme);
                    return (
                        <Pressable
                            key={color}
                            accessibilityRole="radio"
                            accessibilityLabel={`${t('lists.colorOption', { number: index + 1 })}, ${hex}`}
                            accessibilityState={{ selected: color === value, disabled }}
                            disabled={disabled}
                            onPress={() => {
                                setCustom(color.startsWith('#') ? color : '');
                                onChange(color);
                            }}
                            style={{
                                width: 44,
                                height: 44,
                                backgroundColor: hex,
                                opacity: disabled ? 0.5 : 1,
                            }}
                            className="items-center justify-center rounded-full active:opacity-80"
                        >
                            {color === value ? (
                                <Ionicons name="checkmark" size={24} color={readableInk(hex)} />
                            ) : null}
                        </Pressable>
                    );
                })}
            </View>
            <TextField
                label={t('calendar.customColor')}
                value={custom}
                placeholder="#2563eb"
                autoCapitalize="none"
                autoCorrect={false}
                maxLength={7}
                editable={!disabled}
                onChangeText={(text) => {
                    setCustom(text);
                    if (/^#[0-9a-fA-F]{6}$/.test(text)) onChange(text.toLowerCase());
                }}
            />
            <View
                style={{ height: 6, borderRadius: 3, backgroundColor: accentHex(value, theme) }}
            />
        </View>
    );
}
