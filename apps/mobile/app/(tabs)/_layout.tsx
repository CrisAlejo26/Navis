import { Redirect, Tabs } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { AnimatedTabBar } from '@/components/navigation/animated-tab-bar';
import { MoreMenu } from '@/components/navigation/more-menu';
import { BrandSplash } from '@/components/auth/brand-splash';
import { useLocalSession } from '@/stores/local-session';

/**
 * Área autenticada, con sesión **local** (RFC 0024, Fase 1). La barra inferior
 * es la de `AnimatedTabBar` (pill con spring); «Más» abre `MoreMenu`, un
 * bottom sheet con el resto de secciones. Sin sesión completa —cuenta e
 * iglesia— no se entra: la lleva `(auth)`.
 */
export default function TabsLayout() {
  const { t } = useTranslation();
  const session = useLocalSession((state) => state.session);
  const hydrated = useLocalSession((state) => state.hydrated);
  const [menuOpen, setMenuOpen] = useState(false);

  if (!hydrated) return <BrandSplash />;

  if (!session?.churchId) return <Redirect href="/(auth)/welcome" />;

  return (
    <View className="flex-1">
      <Tabs
        tabBar={(props) => (
          <AnimatedTabBar
            {...props}
            menuOpen={menuOpen}
            onToggleMenu={() => setMenuOpen((o) => !o)}
          />
        )}
        screenOptions={{ headerShown: false }}
      >
        <Tabs.Screen name="index" options={{ title: t('nav.dashboard') }} />
        <Tabs.Screen name="calendar" options={{ title: t('nav.calendar') }} />
        <Tabs.Screen name="believers" options={{ title: t('nav.believers') }} />
        <Tabs.Screen name="more" options={{ title: t('nav.more') }} />
        <Tabs.Screen name="settings" options={{ title: t('nav.settings') }} />
      </Tabs>
      <MoreMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </View>
  );
}
