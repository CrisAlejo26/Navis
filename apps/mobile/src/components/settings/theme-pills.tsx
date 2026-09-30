import type { ThemeMode } from '@navis/shared';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';

import { cn } from '@/lib/cn';
import { useThemeStore } from '@/lib/theme';

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

    return (
        <View
            accessibilityRole="radiogroup"
            accessibilityLabel={t('theme.label')}
            className="my-3 p-1 flex-row rounded-full bg-muted"
        >
            {OPTIONS.map((option) => {
                const selected = option.mode === mode;
                return (
                    <Pressable
                        key={option.mode}
                        accessibilityRole="radio"
                        accessibilityState={{ selected }}
                        onPress={() => setMode(option.mode)}
                        className={cn(
                            'h-10 flex-1 items-center justify-center rounded-full',
                            selected && 'bg-primary',
                        )}
                    >
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
    );
}
