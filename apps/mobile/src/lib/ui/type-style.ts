import { FONT_FAMILIES, TYPE_SCALE, type TypeLevel } from '@navis/theme';
import type { TextStyle } from 'react-native';

/**
 * El `style` de RN que corresponde a un nivel de `TYPE_SCALE`: tamaño, alto
 * de línea y la familia ya resuelta a su nombre nativo. Lo usan `Title`,
 * `Subtitle`, `BodyText` y `Caption` (`components/ui`) para no repetir esta
 * búsqueda en cada uno (Regla 1). Cambiar la fuente sigue siendo cosa de
 * `packages/theme/src/fonts.ts`: este fichero solo lee de ahí.
 */
export function typeStyle(level: TypeLevel): TextStyle {
  const scale = TYPE_SCALE[level];
  return {
    fontFamily: FONT_FAMILIES[scale.font].native,
    fontSize: scale.fontSize,
    lineHeight: scale.lineHeight,
  };
}
