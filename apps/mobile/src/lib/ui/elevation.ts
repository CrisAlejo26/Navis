import type { ThemeColors } from '@navis/theme';
import type { ViewStyle } from 'react-native';
import { hexAlpha } from '@/lib/color';
import type { ButtonVariant } from './button-variants';

type ElevationRole = 'button' | 'floating' | 'card' | 'selection' | 'sheet';
const DEPTH = {
    button: [4, 14, 0.2],
    floating: [6, 18, 0.24],
    card: [2, 8, 0.07],
    selection: [1, 4, 0.1],
    sheet: [-4, 18, 0.12],
} as const;

export function elevation(role: ElevationRole, color: string, dark = false): ViewStyle {
    const [offset, blur, opacity] = DEPTH[role];
    return {
        boxShadow: [
            {
                offsetX: 0,
                offsetY: offset,
                blurRadius: blur,
                color: hexAlpha(color, dark ? opacity * 0.7 : opacity),
            },
        ],
    };
}

/** Sombra de listado: el mismo tono del borde, suave y visible en ambos temas. */
export function listCardShadow(color: string, dark = false): ViewStyle {
    return {
        boxShadow: [
            {
                offsetX: 0,
                offsetY: 3,
                blurRadius: 8,
                spreadDistance: 0,
                color: hexAlpha(color, dark ? 0.2 : 0.16),
            },
        ],
    };
}

export function buttonElevation(
    variant: ButtonVariant,
    palette: ThemeColors,
    disabled: boolean,
    dark: boolean,
): ViewStyle {
    if (disabled || (variant !== 'primary' && variant !== 'destructive')) return {};
    return elevation('button', palette[variant], dark);
}
