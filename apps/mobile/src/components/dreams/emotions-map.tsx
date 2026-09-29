import type { DreamEmotionCount } from '@navis/shared';
import { themeColorsHex } from '@navis/theme';
import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { accentHex } from '@/lib/accent';
import { hexAlpha } from '@/lib/color';
import { useEmotionLabel } from '@/lib/dreams/emotion-label';
import { formatNumber } from '@/lib/format';
import { useThemeStore } from '@/lib/theme';

/**
 * **El mapa de emociones** (§7.3): una barra con el color de cada una, y su
 * ancho es cuántos sueños la llevan — color con significado, no decoración.
 * Debajo, la leyenda con el nombre y el número, porque el color no informa
 * solo (Regla 3 §7). Cada tramo abre el listado filtrado por esa emoción.
 */
export function EmotionsMap({ emotions }: { emotions: readonly DreamEmotionCount[] }) {
    const { t } = useTranslation();
    const label = useEmotionLabel();
    const palette = themeColorsHex[useThemeStore((state) => state.resolvedTheme)];
    const total = emotions.reduce((sum, one) => sum + one.count, 0);
    if (total === 0) return null;

    const open = (id: string) => router.push({ pathname: '/dreams/list', params: { emotion: id } });

    return (
        <View className="gap-3 p-4 rounded-2xl border bg-card">
            <Text className="text-sm font-sans-medium text-foreground">
                {t('dreams.emotionsMap')}
            </Text>
            <View className="h-3 flex-row overflow-hidden rounded-full bg-muted">
                {emotions.map((one) => (
                    <Pressable
                        key={one.id}
                        accessibilityRole="button"
                        accessibilityLabel={`${label(one)}: ${t('dreams.emotionUses', { total: one.count })}`}
                        onPress={() => open(one.id)}
                        style={{ flex: one.count, backgroundColor: accentHex(one.accent, palette) }}
                    />
                ))}
            </View>
            <View className="gap-1.5 flex-row flex-wrap">
                {emotions.map((one) => {
                    const color = accentHex(one.accent, palette);
                    return (
                        <Pressable
                            key={one.id}
                            onPress={() => open(one.id)}
                            className="gap-1 px-2 py-0.5 flex-row items-center rounded-full border active:opacity-70"
                            style={{
                                borderColor: hexAlpha(color, 0.35),
                                backgroundColor: hexAlpha(color, 0.1),
                            }}
                        >
                            <View
                                className="size-1.5 rounded-full"
                                style={{ backgroundColor: color }}
                            />
                            <Text className="font-sans-medium text-[11px] text-foreground">
                                {label(one)}
                            </Text>
                            <Text className="text-[10px] text-muted-foreground tabular-nums">
                                {formatNumber(one.count)}
                            </Text>
                        </Pressable>
                    );
                })}
            </View>
        </View>
    );
}
