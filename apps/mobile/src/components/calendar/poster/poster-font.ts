import { FONT_FAMILIES } from '@navis/theme';

/**
 * Las familias reales de Roboto que carga la app (`_layout.tsx`), para que la
 * negrita del SVG se vea de verdad. `fontWeight` por sí solo no la sintetiza
 * de forma fiable en Android dentro de `react-native-svg`: hace falta el
 * fichero de la fuente exacta, como en cualquier otro texto de la app.
 */
export const POSTER_FONT = {
  regular: FONT_FAMILIES.sans.native,
  medium: FONT_FAMILIES.sansMedium.native,
  semiBold: FONT_FAMILIES.sansSemiBold.native,
  bold: FONT_FAMILIES.sansBold.native,
} as const;
