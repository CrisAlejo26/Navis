import { themeColorsHex, type ResolvedTheme, type ThemeColors } from '@navis/theme';

/**
 * Los colores de la lámina, en hexadecimal —la pareja de
 * `poster-palette.ts` de la web—. La misma paleta de `themeColorsHex`, que ya
 * usan la barra de estado y el splash: no se elige ningún color a ojo.
 */
export interface PosterPalette {
  /** La paleta entera, para `accentHex`. */
  palette: ThemeColors;
  background: string;
  card: string;
  foreground: string;
  muted: string;
  border: string;
}

export function posterPalette(theme: ResolvedTheme): PosterPalette {
  const colors = themeColorsHex[theme];

  return {
    palette: colors,
    background: colors.background,
    card: colors.card,
    foreground: colors.foreground,
    muted: colors.mutedForeground,
    border: colors.border,
  };
}
