import '@/global.css';

import {
    Poppins_400Regular,
    Poppins_400Regular_Italic,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Poppins_700Bold_Italic,
    Poppins_800ExtraBold,
} from '@expo-google-fonts/poppins';
import { themeColorsHex } from '@navis/theme';
import { AppBackdrop } from '@/components/navigation/app-backdrop';
import { BootSplash } from '@/components/splash/boot-splash';
import { MORE_MENU_ENTRIES } from '@/lib/nav-mobile';
import { QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { I18nextProvider, useTranslation } from 'react-i18next';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';

import { i18n } from '@/lib/i18n';
import { initializeTestUser } from '@/data/demo-data';
import { useNotificationSync } from '@/hooks/use-notification-sync';
import { useNotificationTap } from '@/hooks/use-notification-tap';
import { useNavigationTheme } from '@/lib/navigation-theme';
import { PUSHED_SCREEN_ANIMATION } from '@/lib/pushed-screens';
import { queryClient } from '@/lib/query-client';
import { useStatusBarStore } from '@/lib/status-bar';
import { useThemeStore } from '@/lib/theme';

// BootSplash oculta el splash nativo una vez maquetado.
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
    const reclamado = useStatusBarStore((state) => state.style);
    useNotificationSync();
    useNotificationTap();

    return (
        <ThemeProvider value={navigationTheme}>
            <StatusBar style={reclamado ?? (resolvedTheme === 'dark' ? 'light' : 'dark')} />
            <AppBackdrop />
            <Stack
                screenOptions={{
                    headerShown: false,
                    headerStyle: { backgroundColor: palette.card },
                    headerTintColor: palette.foreground,
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
                        options={{
                            // Profecías, sueños y enseñanzas pintan su propia `AppBar`, como su listado y su ficha.
                            headerShown: ![
                                'prophecies',
                                'dreams',
                                'teachings',
                                'lists',
                                'tables',
                                'journal',
                                'tasks',
                            ].includes(name),
                            title: t(titleKey),
                            animation: PUSHED_SCREEN_ANIMATION,
                        }}
                    />
                ))}
                <Stack.Screen
                    name="tables/[id]/row"
                    options={{
                        headerShown: false,
                        title: t('nav.tables'),
                        animation: PUSHED_SCREEN_ANIMATION,
                    }}
                />
                <Stack.Screen
                    name="journal/list"
                    options={{ headerShown: false, animation: PUSHED_SCREEN_ANIMATION }}
                />
                <Stack.Screen
                    name="journal/[id]"
                    options={{ headerShown: false, animation: PUSHED_SCREEN_ANIMATION }}
                />
                <Stack.Screen
                    name="tables/[id]"
                    options={{
                        headerShown: false,
                        title: t('nav.tables'),
                        animation: PUSHED_SCREEN_ANIMATION,
                    }}
                />
                <Stack.Screen
                    name="lists/[id]"
                    options={{
                        headerShown: false,
                        title: t('nav.lists'),
                        animation: PUSHED_SCREEN_ANIMATION,
                    }}
                />
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
                    name="believers/notes/[id]"
                    options={{ headerShown: false, animation: PUSHED_SCREEN_ANIMATION }}
                />
                <Stack.Screen
                    name="settings/profile"
                    options={{ headerShown: false, animation: PUSHED_SCREEN_ANIMATION }}
                />
                <Stack.Screen
                    name="settings/notifications"
                    options={{ headerShown: false, animation: PUSHED_SCREEN_ANIMATION }}
                />
                <Stack.Screen
                    name="settings/backup"
                    options={{ headerShown: false, animation: PUSHED_SCREEN_ANIMATION }}
                />
                <Stack.Screen
                    name="settings/church"
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
                    name="dreams/list"
                    options={{ headerShown: false, animation: PUSHED_SCREEN_ANIMATION }}
                />
                <Stack.Screen
                    name="dreams/[id]"
                    options={{ headerShown: false, animation: PUSHED_SCREEN_ANIMATION }}
                />
                <Stack.Screen
                    name="teachings/list"
                    options={{ headerShown: false, animation: PUSHED_SCREEN_ANIMATION }}
                />
                <Stack.Screen
                    name="teachings/[id]"
                    options={{ headerShown: false, animation: PUSHED_SCREEN_ANIMATION }}
                />
                <Stack.Screen
                    name="teachings/edit"
                    options={{ headerShown: false, animation: PUSHED_SCREEN_ANIMATION }}
                />
                <Stack.Screen
                    name="church/new"
                    options={{ headerShown: false, animation: PUSHED_SCREEN_ANIMATION }}
                />
                <Stack.Screen
                    name="settings/churches/new"
                    options={{ headerShown: false, animation: PUSHED_SCREEN_ANIMATION }}
                />
                <Stack.Screen
                    name="settings/churches"
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
        Poppins_400Regular,
        Poppins_400Regular_Italic,
        Poppins_500Medium,
        Poppins_600SemiBold,
        Poppins_700Bold,
        Poppins_700Bold_Italic,
        Poppins_800ExtraBold,
    });

    useEffect(() => {
        if (fontsLoaded) void SplashScreen.hideAsync();
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
            <SafeAreaProvider initialMetrics={initialWindowMetrics}>
                <I18nextProvider i18n={i18n}>
                    <QueryClientProvider client={queryClient}>
                        <RootNavigator />
                    </QueryClientProvider>
                </I18nextProvider>
            </SafeAreaProvider>
        </GestureHandlerRootView>
    );
}
