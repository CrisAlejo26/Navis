import { Ionicons } from '@expo/vector-icons';
import { themeColorsHex } from '@navis/theme';
import * as Haptics from 'expo-haptics';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
    Easing,
    interpolate,
    useAnimatedStyle,
    useReducedMotion,
    useSharedValue,
    withSpring,
    withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MoreMenuContent } from '@/components/navigation/more-menu-content';
import { useThemeStore } from '@/lib/theme';

/** Lo que tarda en irse la hoja; el desmontaje espera a que termine. */
const CLOSE_MS = 220;
/** Alto de partida hasta que `onLayout` mida la hoja de verdad. */
const FALLBACK_SHEET_HEIGHT = 480;

interface MoreMenuProps {
    open: boolean;
    onClose: () => void;
}

/**
 * Bottom sheet con el resto de secciones. Se monta sobre las pestañas: un
 * fondo atenuado que cierra al pulsarlo y la lámina que sube con spring.
 *
 * Al cerrar se queda montado hasta que la hoja baja y el velo se funde: con
 * `if (!open) return null` desaparecía de golpe. La salida es un progreso
 * propio y no el `exiting` de Reanimated, que depende de que el motor de
 * layout termine de quitar la vista (ver `BootSplash`).
 */
export function MoreMenu({ open, onClose }: MoreMenuProps) {
    const { t } = useTranslation();
    const palette = themeColorsHex[useThemeStore((state) => state.resolvedTheme)];
    const insets = useSafeAreaInsets();
    const reducedMotion = useReducedMotion();

    const [mounted, setMounted] = useState(open);
    // Se monta en el mismo render en que `open` pasa a `true`; se desmonta al acabar la salida.
    if (open && !mounted) setMounted(true);
    const progress = useSharedValue(0);
    const sheetHeight = useSharedValue(FALLBACK_SHEET_HEIGHT);

    useEffect(() => {
        if (open) {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            progress.set(reducedMotion ? withTiming(1, { duration: 0 }) : withSpring(1));
            return;
        }
        progress.set(
            withTiming(0, {
                duration: reducedMotion ? 0 : CLOSE_MS,
                easing: Easing.in(Easing.cubic),
            }),
        );
        const timer = setTimeout(() => setMounted(false), reducedMotion ? 0 : CLOSE_MS);
        return () => clearTimeout(timer);
    }, [open, reducedMotion, progress]);

    const veil = useAnimatedStyle(() => ({ opacity: Math.min(progress.value, 1) }));
    const sheet = useAnimatedStyle(() => ({
        transform: [{ translateY: interpolate(progress.value, [0, 1], [sheetHeight.value, 0]) }],
    }));

    if (!mounted) return null;

    return (
        <View style={StyleSheet.absoluteFill} className="z-50">
            {/* El velo va en el `Pressable` y no en el `Animated.View` del fundido: la
                transparencia por clase (`bg-black/40`) no se pintaba ahí y la hoja, casi
                blanca, se fundía con la pantalla blanca de detrás. */}
            <Animated.View style={[StyleSheet.absoluteFill, veil]}>
                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={t('nav.closeMenu')}
                    onPress={onClose}
                    className="inset-0 bg-black absolute opacity-50"
                />
            </Animated.View>

            <Animated.View
                onLayout={(event) => {
                    sheetHeight.set(event.nativeEvent.layout.height);
                }}
                className="inset-x-0 bottom-0 rounded-t-3xl p-4 absolute border-t border-border bg-card"
                style={[
                    sheet,
                    {
                        paddingBottom: Math.max(insets.bottom, 20),
                        // La sombra hacia arriba despega la hoja de lo que hay detrás.
                        elevation: 24,
                        shadowColor: '#000000',
                        shadowOpacity: 0.25,
                        shadowRadius: 16,
                        shadowOffset: { width: 0, height: -6 },
                    },
                ]}
            >
                <View className="mb-3 h-1 w-10 self-center rounded-full bg-border" aria-hidden />
                <View className="mb-3 gap-4 flex-row items-start justify-between">
                    <View className="gap-0.5">
                        <Text className="text-xl font-bold text-foreground">{t('nav.more')}</Text>
                        <Text className="text-sm text-muted-foreground">
                            {t('nav.allSections')}
                        </Text>
                    </View>
                    <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={t('nav.closeMenu')}
                        onPress={onClose}
                        className="h-11 w-11 items-center justify-center rounded-full active:opacity-70"
                    >
                        <Ionicons name="close" size={22} color={palette.mutedForeground} />
                    </Pressable>
                </View>

                <MoreMenuContent />
            </Animated.View>
        </View>
    );
}
