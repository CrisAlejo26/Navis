import { isCongregationAccent } from '@navis/shared';

import { brandColorHex, themeColorsHex } from './tokens';
import type { ResolvedTheme } from './theme-store';

const HEX = /^#[0-9a-fA-F]{6}$/;

/**
 * Un acento (token de siempre o `#rrggbb` de la paleta ampliada) resuelto a un
 * hexadecimal de verdad.
 *
 * Nace en web (RFC 0002 D14: la lámina que se comparte se rasteriza a imagen, y
 * ni `oklch()` ni una variable CSS sobreviven a ese viaje) y lo necesita también
 * móvil, por el mismo motivo que cualquier prop nativo (icono, SVG, barra de
 * estado): React Native no entiende `oklch()` ni variables CSS (Regla 3 §5). Por
 * eso vive en `theme` y no en `shared`: depende de `themeColorsHex`.
 */
export function accentHex(accent: string, theme: ResolvedTheme = 'light'): string {
  if (HEX.test(accent)) return accent;

  const palette = themeColorsHex[theme];

  if (isCongregationAccent(accent)) {
    if (accent === 'accent') return palette.accent;
    if (accent === 'success') return palette.success;
    if (accent === 'warning') return palette.warning;
    if (accent === 'destructive') return palette.destructive;
    if (accent === 'brand') return brandColorHex;
    return palette.primary;
  }

  return palette.primary;
}
