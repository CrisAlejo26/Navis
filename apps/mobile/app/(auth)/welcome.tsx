import { Ionicons } from '@expo/vector-icons';
import { themeColorsHex } from '@navis/theme';
import { Link, router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { BrandHeader } from '@/components/auth/brand-header';
import { LanguageSelect } from '@/components/language-select';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { prepareDemoSession } from '@/data/demo-data';
import { useLocalSession } from '@/stores/local-session';
import { useThemeStore } from '@/lib/theme';

/**
 * La bienvenida (RFC 0024, Fase 3): la primera vez de verdad. Ofrece crear la
 * cuenta —que en local lleva después a crear la iglesia— o entrar con una
 * que ya existe. El gating de sesión vive en `(auth)/_layout.tsx`; aquí no
 * hay condiciones, solo la puerta.
 *
 * El botón de **datos de prueba** salta el alta entero: cuenta, iglesia y
 * doce hermanos con notas en un toque, para ver la interfaz llena (Regla 11).
 */
export default function WelcomeScreen() {
    const { t } = useTranslation();
    const palette = themeColorsHex[useThemeStore((state) => state.resolvedTheme)];
    const setSession = useLocalSession((state) => state.setSession);
    const [demoLoading, setDemoLoading] = useState(false);

    async function enterDemo(): Promise<void> {
        setDemoLoading(true);
        try {
            const session = await prepareDemoSession();
            setSession(session);
            router.replace('/(tabs)');
        } catch {
            // Silencio: es la demo. Si la siembra tropezó, el botón simplemente
            // vuelve a estar disponible y el segundo intento encuentra todo ya
            // hecho (la promesa compartida de `prepareDemoSession` se lo trae).
        } finally {
            setDemoLoading(false);
        }
    }

    return (
        <View className="flex-1 bg-background">
            <BrandHeader />

            <Animated.View
                entering={FadeInDown.delay(80).duration(420).springify().damping(18)}
                className="gap-8 rounded-t-3xl p-6 pt-10 grow bg-background"
                style={{ marginTop: -20 }}
            >
                <View className="gap-2">
                    <Text className="text-2xl font-semibold text-foreground">
                        {t('auth.welcomeTitle')}
                    </Text>
                    <Text className="text-sm text-muted-foreground">
                        {t('auth.welcomeSubtitle')}
                    </Text>
                </View>

                <View className="gap-3">
                    <Link href="/(auth)/register" asChild>
                        <Button title={t('auth.signUp')} size="lg" />
                    </Link>
                    <Link href="/(auth)/login" asChild>
                        <Button title={t('auth.haveAccountCta')} variant="secondary" size="lg" />
                    </Link>
                    <Button
                        title={t('auth.demoEntry')}
                        variant="outline"
                        size="lg"
                        leadingIcon="flask-outline"
                        loading={demoLoading}
                        onPress={() => {
                            void enterDemo();
                        }}
                    />
                </View>

                <View className="gap-2 items-center">
                    <Ionicons
                        name="phone-portrait-outline"
                        size={20}
                        color={palette.mutedForeground}
                    />
                    <Text className="text-xs max-w-xs text-center text-muted-foreground">
                        {t('auth.localModeNote')}
                    </Text>
                </View>

                <View className="gap-3 items-center">
                    <View className="flex-row justify-center">
                        <ThemeToggle />
                    </View>
                    <View className="mt-5 self-stretch">
                        <LanguageSelect />
                    </View>
                </View>
            </Animated.View>
        </View>
    );
}
