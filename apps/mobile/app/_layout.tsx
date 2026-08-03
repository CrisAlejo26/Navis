import '@/global.css';

import { themeColorsHex } from '@fidus/theme';
import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { I18nextProvider, useTranslation } from 'react-i18next';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Importar este módulo inicializa i18next; tiene que ocurrir antes del primer
// render para que no se vea un parpadeo con las claves sin traducir.
import { i18n } from '@/lib/i18n';
import { queryClient } from '@/lib/query-client';
import { useThemeStore } from '@/lib/theme';

void SplashScreen.preventAutoHideAsync();

/** Pantallas que viven fuera de las pestañas y se abren desde «Más». */
const stackScreens = [
  { name: 'prophecies', titleKey: 'nav.prophecies' },
  { name: 'dreams', titleKey: 'nav.dreams' },
  { name: 'communications', titleKey: 'nav.communications' },
] as const;

function RootNavigator() {
  const { t } = useTranslation();
  const resolvedTheme = useThemeStore((state) => state.resolvedTheme);
  const palette = themeColorsHex[resolvedTheme];

  return (
    <>
      <StatusBar style={resolvedTheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          headerStyle: { backgroundColor: palette.card },
          headerTintColor: palette.foreground,
          contentStyle: { backgroundColor: palette.background },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(auth)" />
        {stackScreens.map(({ name, titleKey }) => (
          <Stack.Screen
            key={name}
            name={name}
            options={{ headerShown: true, title: t(titleKey) }}
          />
        ))}
        <Stack.Screen
          name="+not-found"
          options={{ headerShown: true, title: t('errors.notFound') }}
        />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  useEffect(() => {
    // El store de tema rehidrata desde AsyncStorage de forma asíncrona; se
    // oculta el splash cuando ya sabemos qué tema pintar.
    void SplashScreen.hideAsync();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <I18nextProvider i18n={i18n}>
          <QueryClientProvider client={queryClient}>
            <RootNavigator />
          </QueryClientProvider>
        </I18nextProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
