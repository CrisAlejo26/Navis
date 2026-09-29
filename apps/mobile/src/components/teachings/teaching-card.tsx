import type { TeachingListItem } from '@navis/shared';
import { themeColorsHex } from '@navis/theme';
import { Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ChecklistBadge } from '@/components/teachings/checklist-badge';
import { Icon } from '@/components/ui/icon';
import { SwipeableRow } from '@/components/ui/swipeable-row';
import { hexAlpha } from '@/lib/color';
import { formatDay } from '@/lib/format';
import { useThemeStore } from '@/lib/theme';

interface TeachingCardProps {
    teaching: TeachingListItem;
    onPress: () => void;
    /** Gesto hacia la izquierda: editar, con la enseñanza entera ya pedida. */
    onEdit?: (id: string) => void;
}

/**
 * La tarjeta del listado, con la misma anatomía que `ProphecyCard` y
 * `BelieverCard` (Regla 1, y así se pidió): roundel de icono, cabecera con
 * título y fecha, pastilla a la derecha, extracto y un carril de cierre. Lo
 * propio de esta sección es el tono, que sale de la checklist: ámbar mientras
 * quede algo sin marcar, verde cuando está completa, azul si no hay ninguna.
 * El color siempre va con la cuenta escrita.
 */
export function TeachingCard({ teaching, onPress, onEdit }: TeachingCardProps) {
    const { t } = useTranslation();
    const palette = themeColorsHex[useThemeStore((state) => state.resolvedTheme)];
    const { checklist } = teaching;
    const done = checklist !== null && checklist.checked === checklist.total;
    const tone = !checklist ? 'primary' : done ? 'success' : 'warning';
    const toneHex = palette[tone];

    return (
        <SwipeableRow
            right={
                onEdit
                    ? {
                          icon: 'create-outline',
                          label: t('common.edit'),
                          color: palette.primary,
                          foreground: palette.primaryForeground,
                          onAction: () => onEdit(teaching.id),
                      }
                    : undefined
            }
        >
            <Pressable
                onPress={onPress}
                accessibilityRole="button"
                className="gap-2.5 p-4 rounded-2xl border bg-card active:scale-[0.98]"
                style={{ borderColor: hexAlpha(toneHex, 0.35) }}
            >
                <View className="gap-2.5 flex-row items-center">
                    <Icon
                        name={
                            !checklist
                                ? 'school-outline'
                                : done
                                  ? 'checkmark-done-outline'
                                  : 'checkbox-outline'
                        }
                        tone={tone}
                        background="soft"
                        size="md"
                    />
                    <View className="gap-0.5 min-w-0 flex-1">
                        <Text
                            className="text-base font-sans-semibold text-foreground"
                            numberOfLines={1}
                        >
                            {teaching.title}
                        </Text>
                        <Text className="text-xs text-muted-foreground" numberOfLines={1}>
                            {t('teachings.receivedOn', { date: formatDay(teaching.receivedAt) })}
                        </Text>
                    </View>
                    <ChecklistBadge checklist={checklist} />
                </View>

                {teaching.excerpt ? (
                    <Text className="text-sm text-muted-foreground" numberOfLines={2}>
                        {teaching.excerpt}
                    </Text>
                ) : null}

                {checklist ? (
                    <View
                        className="h-1.5 overflow-hidden rounded-full"
                        style={{ backgroundColor: hexAlpha(toneHex, 0.18) }}
                    >
                        <View
                            className="h-full rounded-full"
                            style={{
                                width: `${String(Math.round((checklist.checked / checklist.total) * 100))}%` as `${number}%`,
                                backgroundColor: toneHex,
                            }}
                        />
                    </View>
                ) : null}
            </Pressable>
        </SwipeableRow>
    );
}
