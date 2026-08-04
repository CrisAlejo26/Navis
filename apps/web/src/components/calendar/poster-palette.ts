import { themeColorsHex, type ResolvedTheme } from '@navis/theme';

/**
 * Los colores de la lámina, en hexadecimal.
 *
 * La paleta de la aplicación vive en `oklch` y el rasterizado a PNG no la
 * digiere (RFC 0002 D14). Es la misma paleta, la de `themeColorsHex`, que ya
 * usan la barra de estado y el splash: no se elige ningún color a ojo.
 */
export interface PosterPalette {
  theme: ResolvedTheme;
  background: string;
  card: string;
  foreground: string;
  muted: string;
  border: string;
}

export function posterPalette(theme: ResolvedTheme): PosterPalette {
  const colors = themeColorsHex[theme];

  return {
    theme,
    background: colors.background,
    card: colors.card,
    foreground: colors.foreground,
    muted: colors.mutedForeground,
    border: colors.border,
  };
}
