import '@/global.css';

import {
  Roboto_400Regular,
  Roboto_500Medium,
  Roboto_600SemiBold,
  Roboto_700Bold,
} from '@expo-google-fonts/roboto';
import { themeColorsHex } from '@navis/theme';
import { AppBackdrop } from '@/components/navigation/app-backdrop';
import { MORE_MENU_ENTRIES } from '@/lib/nav-mobile';
import { QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { I18nextProvider, useTranslation } from 'react-i18next';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Importar este módulo inicializa i18next; tiene que ocurrir antes del primer
// render para que no se vea un parpadeo con las claves sin traducir.
import { i18n } from '@/lib/i18n';
import { initializeTestUser } from '@/data/demo-data';
import { useNavigationTheme } from '@/lib/navigation-theme';
import { PUSHED_SCREEN_ANIMATION } from '@/lib/pushed-screens';
import { queryClient } from '@/lib/query-client';
import { useStatusBarStore } from '@/lib/status-bar';
import { useThemeStore } from '@/lib/theme';

void SplashScreen.preventAutoHideAsync();

/** Pantallas que viven fuera de las pestañas y se abren desde el menú «Más». */
const stackScreens = MORE_MENU_ENTRIES.map(({ name, labelKey }) => ({
  name,
  titleKey: labelKey,
}));

function RootNavigator() {
  const { t } = useTranslation();
  const resolvedTheme = useThemeStore((state) => state.resolvedTheme);
  const palette = themeColorsHex[resolvedTheme];
  const navigationTheme = useNavigationTheme();
  // El estilo que pide la pantalla enfocada (hero del panel, escena de
  // creyentes, ficha); sin reclamante, el del tema. Las pantallas con fondo
  // propio en la zona segura reclaman vía `useStatusBarClaim`.
  const reclamado = useStatusBarStore((state) => state.style);

  return (
    <ThemeProvider value={navigationTheme}>
      <StatusBar style={reclamado ?? (resolvedTheme === 'dark' ? 'light' : 'dark')} />
      <AppBackdrop />
      <Stack
        screenOptions={{
          headerShown: false,
          headerStyle: { backgroundColor: palette.card },
          headerTintColor: palette.foreground,
          // Transparente a propósito: el fondo lo pinta `AppBackdrop`, montado
          // una sola vez detrás del Stack (como en Dreamkeeper).
          contentStyle: { backgroundColor: 'transparent' },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(auth)" />
        {stackScreens.map(({ name, titleKey }) => (
          <Stack.Screen
            key={name}
            name={name}
            options={{ headerShown: true, title: t(titleKey), animation: PUSHED_SCREEN_ANIMATION }}
          />
        ))}
        <Stack.Screen
          name="components"
          options={{
            headerShown: true,
            title: t('catalog.title'),
            animation: PUSHED_SCREEN_ANIMATION,
          }}
        />
        <Stack.Screen
          name="believers/[id]"
          options={{ headerShown: false, animation: PUSHED_SCREEN_ANIMATION }}
        />
        <Stack.Screen
          name="calendar/settings"
          options={{ headerShown: false, animation: PUSHED_SCREEN_ANIMATION }}
        />
        <Stack.Screen
          name="calendar/balance"
          options={{ headerShown: false, animation: PUSHED_SCREEN_ANIMATION }}
        />
        <Stack.Screen
          name="believers/catalog"
          options={{ headerShown: false, animation: PUSHED_SCREEN_ANIMATION }}
        />
        <Stack.Screen
          name="prophecies/list"
          options={{ headerShown: false, animation: PUSHED_SCREEN_ANIMATION }}
        />
        <Stack.Screen
          name="prophecies/[id]"
          options={{ headerShown: false, animation: PUSHED_SCREEN_ANIMATION }}
        />
        <Stack.Screen
          name="+not-found"
          options={{ headerShown: true, title: t('errors.notFound') }}
        />
      </Stack>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  // La pareja tipográfica de Navis (packages/theme/src/fonts.ts): se carga
  // una sola vez, aquí, bajo los mismos nombres que usan los `--font-*` de
  // `tokens.native.css`. Sin esperar a `fontsLoaded`, el primer fotograma
  // saldría con la fuente del sistema y se vería el salto al llegar la real.
  const [fontsLoaded] = useFonts({
    Roboto_400Regular,
    Roboto_500Medium,
    Roboto_600SemiBold,
    Roboto_700Bold,
  });

  useEffect(() => {
    // El store de tema rehidrata desde AsyncStorage de forma asíncrona; se
    // oculta el splash cuando ya sabemos qué tema pintar y ya está la fuente.
    if (fontsLoaded) {
      void SplashScreen.hideAsync();
    }
    // El usuario de prueba se siembra **al arrancar**, como en Dreamkeeper:
    // `demo@navis.app` con sus veinte registros, si no estaba ya. No espera ni
    // lanza: cuando termine, la cuenta simplemente estará en el login.
    void initializeTestUser();
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

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
