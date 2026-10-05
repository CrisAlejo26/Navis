import { createElement, type ComponentProps } from 'react';
import { StyleSheet } from 'react-native';
import { FONT_FAMILIES, type FontToken } from '@navis/theme';
import { Text as CssText } from 'react-native-css/components/Text';

/**
 * El `Text` que recibe la app cuando importa `Text` de `react-native` (ver
 * `metro.config.js`): el de NativeWind, con Poppins por defecto.
 *
 * Sin esto, un `<Text>` que no declara su fuente cae en Roboto, la del sistema
 * de Android: con Roboto de marca no se notaba, con Poppins el cuerpo del texto
 * salía en otra letra que los títulos. Más de cien ficheros usan `Text` directo,
 * así que se fija aquí, una vez.
 *
 * Android no aplica `fontWeight` a una familia que registra `expo-font`: cada
 * peso de Poppins es un fichero con su nombre. Por eso `font-semibold` o
 * `fontWeight: '600'` se traducen a `Poppins_600SemiBold`, y no se deja
 * `fontWeight` encima, que lo engrosaría dos veces.
 *
 * Se respeta cualquier familia puesta a propósito: la de `font-sans`,
 * `font-display`… por clase, o `fontFamily` en el `style`. Nunca va después de
 * ellas, porque el `style` en línea ganaría a la clase.
 */
type TextProps = ComponentProps<typeof CssText>;

const CLASS_WITH_FAMILY = /(^|\s)font-(sans|display|mono|serif)/;
const WEIGHT_CLASS = /(^|\s)font-(medium|semibold|bold|extrabold|black)(\s|$)/;
const FONT_BY_WEIGHT: Record<string, FontToken> = {
    medium: 'sansMedium',
    '500': 'sansMedium',
    semibold: 'sansSemiBold',
    '600': 'sansSemiBold',
    bold: 'sansBold',
    '700': 'sansBold',
    extrabold: 'sansExtraBold',
    black: 'sansExtraBold',
    '800': 'sansExtraBold',
    '900': 'sansExtraBold',
};

/** El peso que pide el texto, sea por clase (`font-semibold`) o por `style`. */
function requestedWeight(className: unknown, fontWeight: unknown): string | undefined {
    if (typeof fontWeight === 'string' || typeof fontWeight === 'number') return String(fontWeight);
    if (typeof className !== 'string') return undefined;
    return WEIGHT_CLASS.exec(className)?.[2];
}

export function Text({ style, className, ...props }: TextProps): ReturnType<typeof createElement> {
    const flat = StyleSheet.flatten(style);
    const hasFamily =
        (typeof className === 'string' && CLASS_WITH_FAMILY.test(className)) ||
        flat?.fontFamily !== undefined;
    if (hasFamily) return createElement(CssText, { ...props, className, style });

    const token = FONT_BY_WEIGHT[requestedWeight(className, flat?.fontWeight) ?? ''] ?? 'sans';
    return createElement(CssText, {
        ...props,
        className,
        style: [{ fontFamily: FONT_FAMILIES[token].native, fontWeight: 'normal' }, style],
    });
}

export default Text;
