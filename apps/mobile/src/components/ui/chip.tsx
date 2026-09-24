import { Ionicons } from '@expo/vector-icons';
import { themeColorsHex, type ThemeColors } from '@navis/theme';
import { Pressable, Text, View } from 'react-native';

import { cn } from '@/lib/cn';
import { hexAlpha } from '@/lib/color';
import type { IoniconName } from '@/lib/nav-mobile';
import { useThemeStore } from '@/lib/theme';

type ChipTone = 'primary' | 'accent' | 'success' | 'warning' | 'destructive' | 'muted';

const TONE_KEY: Record<ChipTone, keyof ThemeColors> = {
    primary: 'primary',
    accent: 'accent',
    success: 'success',
    warning: 'warning',
    destructive: 'destructive',
    muted: 'mutedForeground',
};

interface ChipProps {
    label: string;
    /** Controlado: el dueño del estado decide qué chips están marcados. */
    selected?: boolean;
    onPress?: () => void;
    /** Si llega, se enseña la «x» para quitarlo; exige `removeLabel` (Regla 2). */
    onRemove?: () => void;
    /** Etiqueta accesible del botón de quitar: sin texto visible, hay que dársela. */
    removeLabel?: string;
    icon?: IoniconName;
    tone?: ChipTone;
    /** Hex propio (p. ej. el color de una etiqueta, RFC 0018); pisa al `tone`. */
    color?: string;
    disabled?: boolean;
    className?: string;
    /**
     * Sobre una escena de fondo (la cabecera de creyentes): pastilla de vidrio
     * con texto en blanco. Marcada, la pastilla se vuelve blanca sólida con el
     * texto en el tono — sobre el azul, la pastilla tintada no se leería.
     */
    onScene?: boolean;
}

/**
 * Pastilla que se toca — seleccionable y, si toca, removible (Fase 13 §18.1;
 * la hermana que no se toca es `Badge`). Referencias: Matter (filtros activos
 * removibles) y Plane Finder (tags de clase/fuente con su «x»). Marcada:
 * borde, fondo y texto en el tono al 35 % / 14 % / 100 % — el color nunca va
 * solo, siempre con su texto (Regla 3 §7).
 */
export function Chip({
    label,
    selected = false,
    onPress,
    onRemove,
    removeLabel,
    icon,
    tone = 'primary',
    color,
    disabled = false,
    className,
    onScene = false,
}: ChipProps) {
    const palette = themeColorsHex[useThemeStore((state) => state.resolvedTheme)];
    const toneHex = color ?? palette[TONE_KEY[tone]];
    const claro = palette.primaryForeground;

    return (
        <View
            className={cn(
                'flex-row items-center rounded-full',
                disabled && 'opacity-60',
                className,
            )}
        >
            <Pressable
                accessibilityRole="button"
                accessibilityLabel={label}
                accessibilityState={{ selected, disabled }}
                disabled={disabled}
                onPress={onPress}
                className="py-1 gap-1.5 flex-row items-center rounded-full"
                style={{
                    paddingLeft: 12,
                    paddingRight: onRemove ? 22 : 12,
                    borderWidth: 1,
                    borderColor: onScene
                        ? selected
                            ? 'transparent'
                            : 'rgba(255,255,255,0.35)'
                        : selected
                          ? hexAlpha(toneHex, 0.35)
                          : palette.border,
                    backgroundColor: onScene
                        ? selected
                            ? 'rgba(255,255,255,0.92)'
                            : 'rgba(255,255,255,0.16)'
                        : selected
                          ? hexAlpha(toneHex, 0.14)
                          : 'transparent',
                }}
            >
                {icon ? (
                    <Ionicons
                        name={icon}
                        size={14}
                        color={
                            onScene
                                ? selected
                                    ? toneHex
                                    : claro
                                : selected
                                  ? toneHex
                                  : palette.mutedForeground
                        }
                        accessibilityElementsHidden
                        importantForAccessibility="no-hide-descendants"
                    />
                ) : null}
                <Text
                    className="text-xs font-sans-medium"
                    style={{
                        color: onScene
                            ? selected
                                ? toneHex
                                : claro
                            : selected
                              ? toneHex
                              : palette.foreground,
                    }}
                >
                    {label}
                </Text>
            </Pressable>

            {onRemove ? (
                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={removeLabel}
                    accessibilityState={{ disabled }}
                    disabled={disabled}
                    hitSlop={6}
                    onPress={onRemove}
                    className="-ml-5 p-1 rounded-full"
                    style={{ backgroundColor: hexAlpha(toneHex, 0.14) }}
                >
                    <Ionicons
                        name="close"
                        size={12}
                        color={toneHex}
                        accessibilityElementsHidden
                        importantForAccessibility="no-hide-descendants"
                    />
                </Pressable>
            ) : null}
        </View>
    );
}
