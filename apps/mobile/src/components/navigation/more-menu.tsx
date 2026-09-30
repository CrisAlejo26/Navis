import { Ionicons } from '@expo/vector-icons';
import { themeColorsHex } from '@navis/theme';
import * as Haptics from 'expo-haptics';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, SlideInDown, useReducedMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MoreMenuContent } from '@/components/navigation/more-menu-content';
import { useThemeStore } from '@/lib/theme';

interface MoreMenuProps {
    open: boolean;
    onClose: () => void;
}

/**
 * Bottom sheet con el resto de secciones. Se monta sobre las pestañas: un
 * fondo atenuado que cierra al pulsarlo y la lámina que sube con spring.
 */
export function MoreMenu({ open, onClose }: MoreMenuProps) {
    const { t } = useTranslation();
    const palette = themeColorsHex[useThemeStore((state) => state.resolvedTheme)];
    const insets = useSafeAreaInsets();
    const reducedMotion = useReducedMotion();

    useEffect(() => {
        if (open) void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }, [open]);

    if (!open) return null;

    return (
        <View style={StyleSheet.absoluteFill} className="z-50">
            {/* El velo va en el `Pressable` y no en el `Animated.View` del fundido: la
                transparencia por clase (`bg-black/40`) no se pintaba ahí y la hoja, casi
                blanca, se fundía con la pantalla blanca de detrás. */}
            <Animated.View
                entering={reducedMotion ? undefined : FadeIn.duration(160)}
                style={StyleSheet.absoluteFill}
            >
                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={t('nav.closeMenu')}
                    onPress={onClose}
                    className="inset-0 bg-black absolute opacity-50"
                />
            </Animated.View>

            <Animated.View
                entering={SlideInDown.springify()}
                className="inset-x-0 bottom-0 rounded-t-3xl p-4 absolute border-t border-border bg-card"
                style={{
                    paddingBottom: Math.max(insets.bottom, 20),
                    // La sombra hacia arriba despega la hoja de lo que hay detrás.
                    elevation: 24,
                    shadowColor: '#000000',
                    shadowOpacity: 0.25,
                    shadowRadius: 16,
                    shadowOffset: { width: 0, height: -6 },
                }}
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
