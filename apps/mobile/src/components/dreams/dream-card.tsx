import { Ionicons } from '@expo/vector-icons';
import type { DreamListItem } from '@navis/shared';
import { themeColorsHex } from '@navis/theme';
import { Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { DREAM_STATE_ICONS, DREAM_STATE_TONE } from '@/components/dreams/dream-icons';
import { Badge } from '@/components/ui/badge';
import { Icon } from '@/components/ui/icon';
import { SwipeableRow } from '@/components/ui/swipeable-row';
import { accentHex } from '@/lib/accent';
import { hexAlpha } from '@/lib/color';
import { useEmotionLabel } from '@/lib/dreams/emotion-label';
import { formatDay } from '@/lib/format';
import { useThemeStore } from '@/lib/theme';

interface DreamCardProps {
    dream: DreamListItem;
    onPress: () => void;
    /** Gesto hacia la derecha: marcarlo como cumplido sin salir del listado. */
    onFulfill?: (id: string) => void;
    /** Gesto hacia la izquierda: editar, con el sueño entero ya pedido. */
    onEdit?: (id: string) => void;
}

/**
 * La tarjeta del listado, con la anatomía de `ProphecyCard` (Regla 1): un
 * roundel con el icono del estado, cabecera con título y noche, pastilla de
 * estado, extracto y un pie con las emociones. **El color de la tarjeta lo
 * ponen las emociones** —el filo es el de la primera—, que es la pregunta que
 * responde un listado de sueños: qué soñé y cómo se sentía (RFC 0005 §7.5).
 */
export function DreamCard({ dream, onPress, onFulfill, onEdit }: DreamCardProps) {
    const { t } = useTranslation();
    const label = useEmotionLabel();
    const palette = themeColorsHex[useThemeStore((state) => state.resolvedTheme)];
    const tone = DREAM_STATE_TONE[dream.state];
    const rail = dream.emotions[0] ? accentHex(dream.emotions[0].accent, palette) : palette.border;

    return (
        <SwipeableRow
            left={
                onFulfill && dream.state !== 'cumplido'
                    ? {
                          icon: 'sunny-outline',
                          label: t('dreams.fulfillTitle'),
                          color: palette.success,
                          foreground: palette.successForeground,
                          onAction: () => onFulfill(dream.id),
                      }
                    : undefined
            }
            right={
                onEdit
                    ? {
                          icon: 'create-outline',
                          label: t('common.edit'),
                          color: palette.primary,
                          foreground: palette.primaryForeground,
                          onAction: () => onEdit(dream.id),
                      }
                    : undefined
            }
        >
            <Pressable
                onPress={onPress}
                className="gap-2.5 p-4 rounded-2xl border bg-card active:scale-[0.98]"
                style={{ borderColor: hexAlpha(rail, 0.4) }}
            >
                <View className="gap-2.5 flex-row items-center">
                    <Icon
                        name={DREAM_STATE_ICONS[dream.state]}
                        tone={tone === 'muted' ? 'default' : tone}
                        background="soft"
                        size="md"
                    />
                    <View className="gap-0.5 min-w-0 flex-1">
                        <Text
                            className="text-base font-sans-semibold text-foreground"
                            numberOfLines={1}
                        >
                            {dream.title ?? t('dreams.untitled')}
                        </Text>
                        <Text className="text-xs text-muted-foreground" numberOfLines={1}>
                            {t('dreams.dreamedOn', { date: formatDay(dream.dreamedAt) })}
                        </Text>
                    </View>
                    <Badge label={t(`dreams.state.${dream.state}`)} tone={tone} />
                </View>

                <Text className="text-sm text-muted-foreground" numberOfLines={2}>
                    {dream.excerpt}
                </Text>

                <View className="gap-2 flex-row items-center">
                    <View className="gap-1.5 flex-1 flex-row flex-wrap">
                        {dream.emotions.map((emotion) => (
                            <View key={emotion.id} className="gap-1 flex-row items-center">
                                <View
                                    className="size-1.5 rounded-full"
                                    style={{ backgroundColor: accentHex(emotion.accent, palette) }}
                                />
                                <Text className="text-[11px] text-muted-foreground">
                                    {label(emotion)}
                                </Text>
                            </View>
                        ))}
                    </View>
                    {dream.audiosCount > 0 ? (
                        <View
                            accessibilityLabel={`${dream.audiosCount} ${t('common.audio.title')}`}
                            className="gap-1 flex-row items-center"
                        >
                            <Ionicons
                                name="mic-outline"
                                size={12}
                                color={palette.mutedForeground}
                            />
                            <Text className="text-[11px] text-muted-foreground tabular-nums">
                                {dream.audiosCount}
                            </Text>
                        </View>
                    ) : null}
                </View>
            </Pressable>
        </SwipeableRow>
    );
}
