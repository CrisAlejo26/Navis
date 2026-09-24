import { brandColorHex, themeColorsHex, type ThemeColors } from '@navis/theme';
import { isCongregationAccent } from '@navis/shared';

/**
 * El color de un accent de sede (`primary`, `success`… o un hexadecimal),
 * resuelto contra la paleta del tema activo. En React Native no hay clases
 * para props de color: los tokens van por aquí (Regla 3 §5).
 */
export function accentHex(accent: string, palette: ThemeColors): string {
    switch (accent) {
        case 'primary':
            return palette.primary;
        case 'accent':
            return palette.accent;
        case 'success':
            return palette.success;
        case 'warning':
            return palette.warning;
        case 'destructive':
            return palette.destructive;
        case 'brand':
            return brandColorHex;
        default:
            // Un hexadecimal de la paleta ampliada o el que escribió la iglesia.
            return isCongregationAccent(accent) ? palette.primary : accent;
    }
}
