import type { ThemeMode } from '@navis/shared';
import { themeColorsHex } from '@navis/theme';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { cn } from '@/lib/cn';
import { useThemeStore } from '@/lib/theme';
import { settingsButtonEffect } from './settings-effects';

const OPTIONS: { mode: ThemeMode; labelKey: 'theme.light' | 'theme.dark' | 'theme.system' }[] = [
    { mode: 'light', labelKey: 'theme.light' },
    { mode: 'dark', labelKey: 'theme.dark' },
    { mode: 'system', labelKey: 'theme.system' },
];

/** Claro, oscuro o el del sistema: una píldora con la opción activa rellena de azul. */
export function ThemePills() {
    const { t } = useTranslation();
    const mode = useThemeStore((state) => state.mode);
    const setMode = useThemeStore((state) => state.setMode);
    const palette = themeColorsHex[useThemeStore((state) => state.resolvedTheme)];

    return (
        <View className="py-4 gap-3">
            <Text className="font-sans-semibold text-[15px] text-foreground">
                {t('theme.label')}
            </Text>
            <View
                accessibilityRole="radiogroup"
                accessibilityLabel={t('theme.label')}
                className="p-1 flex-row rounded-[16px] bg-muted"
            >
                {OPTIONS.map((option) => {
                    const selected = option.mode === mode;
                    return (
                        <Pressable
                            key={option.mode}
                            accessibilityRole="radio"
                            accessibilityLabel={t(option.labelKey)}
                            accessibilityState={{ selected }}
                            onPress={() => setMode(option.mode)}
                            className={cn(
                                'min-h-12 gap-1.5 px-1 py-2 flex-1 items-center justify-center rounded-[12px]',
                                selected && 'bg-primary',
                            )}
                            style={({ pressed }) =>
                                selected
                                    ? settingsButtonEffect(palette.primary, pressed)
                                    : { opacity: pressed ? 0.7 : 1 }
                            }
                        >
                            <Icon
                                name={
                                    option.mode === 'light'
                                        ? 'sunny-outline'
                                        : option.mode === 'dark'
                                          ? 'moon-outline'
                                          : 'phone-portrait-outline'
                                }
                                size="sm"
                                color={
                                    selected ? palette.primaryForeground : palette.mutedForeground
                                }
                            />
                            <Text
                                className={cn(
                                    'text-sm font-sans-semibold',
                                    selected ? 'text-primary-foreground' : 'text-muted-foreground',
                                )}
                            >
                                {t(option.labelKey)}
                            </Text>
                        </Pressable>
                    );
                })}
            </View>
        </View>
    );
}
