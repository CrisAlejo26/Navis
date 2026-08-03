import { Ionicons } from '@expo/vector-icons';
import type { ThemeMode } from '@navis/shared';
import { themeColorsHex } from '@navis/theme';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';

import { cn } from '@/lib/cn';
import { useThemeStore } from '@/lib/theme';

const options: { mode: ThemeMode; icon: keyof typeof Ionicons.glyphMap; labelKey: string }[] = [
  { mode: 'light', icon: 'sunny-outline', labelKey: 'theme.light' },
  { mode: 'dark', icon: 'moon-outline', labelKey: 'theme.dark' },
  { mode: 'system', icon: 'phone-portrait-outline', labelKey: 'theme.system' },
];

/** Selector de tema con las tres opciones: claro, oscuro y seguir al sistema. */
export function ThemeToggle() {
  const { t } = useTranslation();
  const mode = useThemeStore((state) => state.mode);
  const resolvedTheme = useThemeStore((state) => state.resolvedTheme);
  const setMode = useThemeStore((state) => state.setMode);

  // Los iconos de @expo/vector-icons no admiten `className`: hay que darles el
  // color en hexadecimal (React Native no entiende oklch).
  const palette = themeColorsHex[resolvedTheme];

  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={t('theme.label')}
      className="gap-1 p-1 flex-row self-start rounded-lg bg-muted"
    >
      {options.map(({ mode: value, icon, labelKey }) => {
        const selected = mode === value;
        return (
          <Pressable
            key={value}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLabel={t(labelKey)}
            onPress={() => {
              setMode(value);
            }}
            className={cn(
              'gap-1.5 px-3 py-1.5 flex-row items-center rounded-md',
              selected && 'bg-card',
            )}
          >
            <Ionicons
              name={icon}
              size={16}
              color={selected ? palette.foreground : palette.mutedForeground}
            />
            <Text className={cn('text-sm', selected ? 'text-foreground' : 'text-muted-foreground')}>
              {t(labelKey)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
