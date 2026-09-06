import { Ionicons } from '@expo/vector-icons';
import { themeColorsHex } from '@navis/theme';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';
import Animated, { SlideInDown } from 'react-native-reanimated';

import { MORE_MENU_ENTRIES, type MobileNavGroup } from '@/lib/nav-mobile';
import { useThemeStore } from '@/lib/theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const GROUP_LABELS: Record<MobileNavGroup, string> = {
  general: 'nav.groupGeneral',
  church: 'nav.groupChurch',
};

const GROUPS: readonly MobileNavGroup[] = ['general', 'church'];

/** Las entradas del menú «Más», agrupadas como la sidebar web. */
export function MoreMenuContent() {
  const { t } = useTranslation();
  const palette = themeColorsHex[useThemeStore((state) => state.resolvedTheme)];
  let row = 0;

  return (
    <View className="gap-4">
      {GROUPS.map((group) => (
        <View key={group} className="gap-2">
          <Text className="px-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {t(GROUP_LABELS[group])}
          </Text>
          <View className="gap-2">
            {MORE_MENU_ENTRIES.filter((entry) => entry.group === group).map((entry) => {
              const delay = row++;
              return (
                <AnimatedPressable
                  key={entry.name}
                  accessibilityRole="link"
                  entering={SlideInDown.delay(delay * 40).springify()}
                  onPress={() => router.push(`/${entry.name}`)}
                  className="gap-3 p-4 flex-row items-center rounded-xl border border-border bg-card active:opacity-80"
                >
                  <Ionicons name={entry.icon} size={20} color={palette.primary} />
                  <Text className="text-base flex-1 text-foreground">{t(entry.labelKey)}</Text>
                  <Ionicons name="chevron-forward" size={18} color={palette.mutedForeground} />
                </AnimatedPressable>
              );
            })}
          </View>
        </View>
      ))}
    </View>
  );
}
