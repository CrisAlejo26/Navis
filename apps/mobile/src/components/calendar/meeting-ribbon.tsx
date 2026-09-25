import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';

import { cn } from '@/lib/cn';
import { accentHex } from '@/lib/accent';
import { getLocale } from '@/lib/i18n';
import { useThemeStore } from '@/lib/theme';
import { themeColorsHex } from '@navis/theme';
import Animated, { FadeIn, FadeInDown, useReducedMotion } from 'react-native-reanimated';
import { isSlotEmpty, slotNames, type Meeting, type MeetingSlot } from '@navis/shared';

interface MeetingRibbonProps {
    meeting: Meeting;
    /** El nombre de la sede en la cabecera: solo cuando hay más de una (D12). */
    congregationName?: string;
    /** Poder tocarla para asignar: sin él, la cinta es de lectura. */
    onPick?: (slot: MeetingSlot, meeting: Meeting) => void;
    /** Posición en la lista: escalona la entrada (un día tras otro, sin rebotes). */
    enterIndex?: number;
    className?: string;
}

/**
 * La **cinta de fases** — el elemento firma del calendario (RFC 0002 §8.1).
 * Un carril del color de la sede y, colgando de él, una línea por fase. Los
 * huecos no se esconden: una fase sin asignar es una línea de puntos que
 * pide que la rellenen.
 */
export function MeetingRibbon({
    meeting,
    congregationName,
    onPick,
    enterIndex,
    className,
}: MeetingRibbonProps) {
    const { t } = useTranslation();
    const palette = themeColorsHex[useThemeStore((state) => state.resolvedTheme)];
    const reducedMotion = useReducedMotion();
    const color = accentHex(meeting.accent, palette);
    const cancelada = meeting.status === 'cancelada';

    return (
        <Animated.View
            entering={
                reducedMotion || enterIndex === undefined
                    ? undefined
                    : FadeInDown.delay(enterIndex * 60).duration(240)
            }
            accessibilityLabel={`${meeting.name}, ${meeting.startTime}`}
            className={cn('gap-1 p-3 rounded-xl border border-border bg-card', className)}
        >
            <View style={{ borderLeftColor: color, borderLeftWidth: 3 }} className="pl-2 gap-1">
                <View className="gap-1.5 flex-row items-center">
                    {congregationName ? (
                        <Text className="font-sans-medium text-[11px] text-muted-foreground uppercase">
                            {congregationName} ·{' '}
                        </Text>
                    ) : null}
                    <Text
                        className={cn(
                            'font-sans-medium text-[11px] tracking-[0.08em] uppercase',
                            cancelada ? 'text-muted-foreground line-through' : 'text-foreground',
                        )}
                    >
                        {meeting.name} · {meeting.startTime}
                    </Text>
                </View>

                {meeting.slots.map((slot) => (
                    <SlotLine
                        key={`${slot.name}-${slot.position}`}
                        slot={slot}
                        canManage={!cancelada && Boolean(onPick)}
                        onPress={onPick ? () => onPick(slot, meeting) : undefined}
                    />
                ))}
            </View>
        </Animated.View>
    );
}

function SlotLine({
    slot,
    canManage,
    onPress,
}: {
    slot: MeetingSlot;
    canManage: boolean;
    onPress?: () => void;
}) {
    const { t } = useTranslation();
    // El hook va **aquí**, fuera de todo condicional: llamarlo dentro del
    // ternario de abajo rompe el orden de hooks y tumba el render (Regla 6).
    const reducedMotion = useReducedMotion();

    return (
        <Pressable
            accessibilityRole={canManage ? 'button' : 'text'}
            accessibilityLabel={`${slot.name}: ${slotNames(slot, getLocale(), t('calendar.unassigned'))}`}
            onPress={onPress}
            disabled={!canManage}
            className={cn(
                'gap-1.5 flex-row items-center',
                canManage && 'min-h-[44px] cursor-pointer active:opacity-70',
            )}
        >
            <Text className="flex-1 text-[11px] tracking-[0.06em] text-muted-foreground uppercase">
                {slot.name}
            </Text>
            {!isSlotEmpty(slot) ? (
                // El nombre entra con un fundido de 150 ms y se va con el mismo
                // gesto al quitar: es la confirmación de que se ha guardado (§8.8).
                // Con varias personas la clave es el conjunto: al cambiarlo, vuelve a entrar.
                <Animated.View
                    key={slot.believers.map((one) => one.id).join('|')}
                    entering={reducedMotion ? undefined : FadeIn.duration(150)}
                    className="max-w-[60%]"
                >
                    <Text className="text-right text-[13px] text-foreground">
                        {slotNames(slot, getLocale(), '')}
                    </Text>
                </Animated.View>
            ) : (
                <Text className="text-[13px] text-muted-foreground">···········</Text>
            )}
        </Pressable>
    );
}
