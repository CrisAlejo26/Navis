import { FONT_FAMILIES } from '@navis/theme';
import type { TextStyle } from 'react-native';

import type { Style } from '@/lib/teachings/runs';

/**
 * La familia que corresponde a cada combinación de negrita y cursiva. Se
 * elige la fuente entera y no `fontWeight`/`fontStyle`: con Poppins cargada por
 * pesos, esas propiedades no hacen nada en Android y en iOS no inclinan una
 * familia que no trae cursiva.
 */
export function spanStyle({ bold, italic }: Style): TextStyle {
    if (bold && italic) return { fontFamily: FONT_FAMILIES.sansBoldItalic.native };
    if (bold) return { fontFamily: FONT_FAMILIES.sansBold.native };
    if (italic) return { fontFamily: FONT_FAMILIES.sansItalic.native };
    return { fontFamily: FONT_FAMILIES.sans.native };
}
