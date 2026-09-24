import { Ionicons } from '@expo/vector-icons';
import { believerName, type BelieverListItem, type MinistryCatalog } from '@navis/shared';
import { themeColorsHex } from '@navis/theme';
import { Pressable, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';

import { Sonda } from '@/components/believers/sonda';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Icon } from '@/components/ui/icon';
import { SwipeableRow } from '@/components/ui/swipeable-row';
import { believerPhotoUri } from '@/data/photo-storage';
import { hexAlpha } from '@/lib/color';
import type { IoniconName } from '@/lib/nav-mobile';
import { useThemeStore } from '@/lib/theme';

const STATUS_TONE = {
    activo: 'success',
    nuevo: 'primary',
    inactivo: 'muted',
    trasladado: 'warning',
} as const;

interface BelieverCardProps {
    believer: BelieverListItem;
    congregationName: string | null;
    /** El catálogo de labores: el listado guarda slugs, los nombres viven aquí. */
    ministries: MinistryCatalog[];
    index: number;
    /** Selección en lote: cuando hay selección activa, la casilla manda. */
    selected?: boolean;
    selecting?: boolean;
    onToggleSelect?: (id: string) => void;
    onPress: (id: string) => void;
    /** Gesto hacia la derecha: la hoja de nota nueva de este creyente. */
    onAddNote?: (id: string) => void;
    /** Gesto hacia la izquierda: la edición con lo que trae la fila. */
    onEdit?: (believer: BelieverListItem) => void;
    /**
     * La entrada animada: **solo en la primera carga** de la sesión. Cuando la
     * pantalla recupera el foco al volver de una ficha, las tarjetas se
     * remontan y la animación volvería a correr — ese saltito es el que se
     * paga —; sin ella, volver es una transición tan limpia como entrar.
     */
    animar?: boolean;
}

/**
 * La tarjeta de creyente del listado móvil, con la anatomía de Dreamkeeper
 * (la app de referencia) y los tokens de Navis:
 *
 * - **Cabecera**: avatar, nombre y teléfono, estado a la derecha y el
 *   chevron que dice «esto abre la ficha».
 * - **Carril de clasificación, siempre de una línea**: dones como pastilla
 *   con icono de regalo y la **cantidad**, labores igual con su propio
 *   icono, y las **etiquetas** —que sí son importantes— con su nombre y su
 *   color. Sin nada, la línea queda tenue con el motivo. Así todas las
 *   tarjetas miden lo mismo aunque unas traigan clasificación y otras no.
 * - Al pie, la **sonda** a lo ancho —que es donde mejor se lee— y el
 *   **contador de notas**, siempre visible, atenuado cuando va a cero.
 *
 * Los gestos siguen el patrón de taskia: a la derecha, **nueva nota** (el
 * gesto positivo, verde de éxito); a la izquierda, **editar**. El borrado no
 * va por gesto: es una decisión y se queda en la ficha. En modo selección el
 * gesto se apaga — la casilla manda.
 */
export function BelieverCard({
    believer,
    congregationName,
    ministries,
    index,
    selected = false,
    selecting = false,
    onToggleSelect,
    onPress,
    onAddNote,
    onEdit,
    animar = true,
}: BelieverCardProps) {
    const { t } = useTranslation();
    const palette = themeColorsHex[useThemeStore((state) => state.resolvedTheme)];
    const name = believerName(believer);
    const showCheckbox = selecting || selected;

    return (
        <Animated.View
            entering={animar && index < 12 ? FadeInDown.delay(index * 40).springify() : undefined}
        >
            <SwipeableRow
                disabled={selecting}
                left={
                    onAddNote
                        ? {
                              icon: 'document-text-outline',
                              label: t('believers.swipeNote'),
                              color: palette.success,
                              foreground: palette.successForeground,
                              onAction: () => onAddNote(believer.id),
                          }
                        : undefined
                }
                right={
                    onEdit
                        ? {
                              icon: 'create-outline',
                              label: t('believers.swipeEdit'),
                              color: palette.primary,
                              foreground: palette.primaryForeground,
                              onAction: () => onEdit(believer),
                          }
                        : undefined
                }
            >
                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={t('believers.selectOne', { name })}
                    onPress={() =>
                        selecting ? onToggleSelect?.(believer.id) : onPress(believer.id)
                    }
                    onLongPress={() => onToggleSelect?.(believer.id)}
                    className="gap-2 rounded-2xl p-4 border bg-card active:opacity-90"
                    style={{
                        borderColor: believer.needsAttention
                            ? hexAlpha(palette.destructive, 0.35)
                            : palette.border,
                    }}
                >
                    <View className="gap-2.5 flex-row items-center">
                        {showCheckbox ? (
                            <Checkbox
                                checked={selected}
                                onChange={() => onToggleSelect?.(believer.id)}
                                label={t('believers.selectOne', { name })}
                            />
                        ) : null}
                        <Avatar
                            name={name}
                            size="md"
                            photoUri={believer.hasPhoto ? believerPhotoUri(believer.id) : undefined}
                        />
                        <View className="gap-0.5 min-w-0 flex-1">
                            <Text
                                className="text-base font-sans-semibold text-foreground"
                                numberOfLines={1}
                            >
                                {name}
                            </Text>
                            {believer.phone ? (
                                <View className="gap-1 flex-row items-center">
                                    <Icon name="call-outline" size="sm" tone="primary" />
                                    <Text
                                        className="text-xs text-foreground tabular-nums"
                                        numberOfLines={1}
                                    >
                                        {believer.phone}
                                    </Text>
                                </View>
                            ) : (
                                <Text className="text-xs text-muted-foreground" numberOfLines={1}>
                                    {congregationName ?? t('believers.noCongregation')}
                                </Text>
                            )}
                        </View>
                        <Badge
                            label={t(`believers.status.${believer.status}`)}
                            tone={STATUS_TONE[believer.status]}
                        />
                        <Icon name="chevron-forward" size="sm" />
                    </View>

                    <ClassificationRow believer={believer} ministries={ministries} />

                    <View className="gap-2 flex-row items-center">
                        <View className="min-w-0 flex-1">
                            <Sonda
                                daysWithoutNote={believer.daysWithoutNote}
                                alertAfterDays={believer.alertAfterDays}
                                hasNotes={believer.notesCount > 0 || believer.lastNoteAt !== null}
                                index={index}
                            />
                        </View>
                        <View className="gap-1 flex-row items-center">
                            <Icon name="document-text-outline" size="sm" />
                            <Text className="text-xs text-muted-foreground tabular-nums">
                                {believer.notesCount}
                            </Text>
                        </View>
                    </View>
                </Pressable>
            </SwipeableRow>
        </Animated.View>
    );
}

/**
 * El color de un acento: token de la paleta o hex directo, como en la web.
 * En el propio componente — el tema se lee donde se pinta.
 */
function useAccentColor(): (accent: string) => string {
    const palette = themeColorsHex[useThemeStore((state) => state.resolvedTheme)];
    return (accent) =>
        accent.startsWith('#')
            ? accent
            : (palette[accent as keyof typeof palette] ?? palette.primary);
}

/** Una pastilla de recuento, como las etiquetas de Dreamkeeper: icono y cantidad. */
function CountTag({
    icon,
    count,
    accent,
    label,
}: {
    icon: IoniconName;
    count: number;
    accent: string;
    label: string;
}) {
    const color = useAccentColor()(accent);
    return (
        <View
            accessibilityLabel={label}
            className="gap-1 flex-row items-center rounded-full"
            style={{
                maxWidth: '30%',
                paddingLeft: 7,
                paddingRight: 9,
                paddingVertical: 3,
                borderWidth: 1,
                borderColor: hexAlpha(color, 0.45),
            }}
        >
            <Ionicons name={icon} size={11} color={color} aria-hidden />
            <Text className="font-sans-semibold text-[11px] tabular-nums" style={{ color }}>
                {count}
            </Text>
        </View>
    );
}

/**
 * El carril de clasificación: dones y labores como recuentos y las etiquetas
 * con su nombre. La pastilla va tintada con el acento del primer elemento —
 * el color del creyente, no el de la tarjeta (§7.1: el color en el borde y el
 * icono, no rellenando — la sonda manda en esta pantalla).
 */
function ClassificationRow({
    believer,
    ministries,
}: {
    believer: BelieverListItem;
    ministries: MinistryCatalog[];
}) {
    const { t } = useTranslation();
    const colorOf = useAccentColor();

    const { gifts, tags, ministries: slugs } = believer;
    const orderedTags = [...tags].sort(
        (a, b) => Number(b.id === believer.featuredTagId) - Number(a.id === believer.featuredTagId),
    );
    const shownTags = orderedTags.slice(0, 2);
    const restTags = tags.length - shownTags.length;
    const ministryAccent = ministries.find((one) => one.slug === slugs[0])?.accent;

    if (gifts.length === 0 && slugs.length === 0 && tags.length === 0) {
        return (
            <View className="h-6 flex-row items-center">
                <Text className="text-[11px] text-muted-foreground">
                    {t('believers.noClassification')}
                </Text>
            </View>
        );
    }

    return (
        <View className="h-6 gap-1.5 flex-row items-center overflow-hidden">
            {gifts.length > 0 ? (
                <CountTag
                    icon="gift-outline"
                    count={gifts.length}
                    accent={gifts[0].accent}
                    label={`${t('believers.gifts')}: ${gifts.length}`}
                />
            ) : null}
            {slugs.length > 0 ? (
                <CountTag
                    icon="construct-outline"
                    count={slugs.length}
                    accent={ministryAccent ?? 'primary'}
                    label={`${t('believers.ministries')}: ${slugs.length}`}
                />
            ) : null}

            {shownTags.map((tag) => {
                const color = colorOf(tag.accent);
                return (
                    <View
                        key={tag.id}
                        className="rounded-full"
                        style={{
                            maxWidth: '42%',
                            paddingLeft: 8,
                            paddingRight: 8,
                            paddingVertical: 3,
                            backgroundColor: hexAlpha(color, 0.14),
                        }}
                    >
                        <Text
                            className="font-sans-medium flex-shrink text-[11px]"
                            style={{ color }}
                            numberOfLines={1}
                        >
                            {tag.name}
                        </Text>
                    </View>
                );
            })}

            {restTags > 0 ? (
                <Text className="text-[11px] text-muted-foreground tabular-nums" numberOfLines={1}>
                    {t('believers.moreTags', { count: restTags })}
                </Text>
            ) : null}
        </View>
    );
}
