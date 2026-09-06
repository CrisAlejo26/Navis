import { Redirect, Tabs } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, View } from 'react-native';

import { AnimatedTabBar } from '@/components/navigation/animated-tab-bar';
import { MoreMenu } from '@/components/navigation/more-menu';
import { useSession } from '@/lib/auth-client';

/**
 * Área autenticada. La barra inferior es la de `AnimatedTabBar` (pill con
 * spring); «Más» abre `MoreMenu`, un bottom sheet con el resto de secciones.
 */
export default function TabsLayout() {
  const { t } = useTranslation();
  const { data: session, isPending } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);

  if (isPending) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator />
      </View>
    );
  }

  if (!session) return <Redirect href="/(auth)/login" />;

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
