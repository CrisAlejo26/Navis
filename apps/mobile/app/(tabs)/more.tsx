import { Ionicons } from '@expo/vector-icons';
import { themeColorsHex } from '@fidus/theme';
import { Link } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Text } from 'react-native';

import { useThemeStore } from '@/lib/theme';

const sections = [
  { href: '/prophecies', labelKey: 'nav.prophecies', icon: 'sparkles-outline' },
  { href: '/dreams', labelKey: 'nav.dreams', icon: 'moon-outline' },
  { href: '/communications', labelKey: 'nav.communications', icon: 'chatbubbles-outline' },
] as const;

/** Agrupa las secciones que no caben en la barra inferior. */
export default function MoreScreen() {
  const { t } = useTranslation();
  const resolvedTheme = useThemeStore((state) => state.resolvedTheme);
  const palette = themeColorsHex[resolvedTheme];

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="gap-2 p-4 pt-16">
      <Text className="mb-2 text-2xl font-semibold text-foreground">{t('nav.more')}</Text>

      {sections.map(({ href, labelKey, icon }) => (
        <Link key={href} href={href} asChild>
          <Pressable
            accessibilityRole="link"
            className="gap-3 p-4 flex-row items-center rounded-xl border border-border bg-card active:opacity-80"
          >
            <Ionicons name={icon} size={20} color={palette.primary} />
            <Text className="text-base flex-1 text-foreground">{t(labelKey)}</Text>
            <Ionicons name="chevron-forward" size={18} color={palette.mutedForeground} />
          </Pressable>
        </Link>
      ))}
    </ScrollView>
  );
}
