import { brandColorHex, themeColorsHex, type ResolvedTheme } from '@navis/theme';

/**
 * Cómo se pinta cada sede: el carril de su cinta, su etiqueta y su punto.
 *
 * Es un **mapa de variantes** (Regla 1) y no una clase construida al vuelo:
 * `bg-${accent}` no existiría para Tailwind, que solo ve las clases escritas.
 */
interface AccentStyles {
  /** El carril vertical de la cinta. */
  rail: string;
  /** El texto de la sede en la cabecera del carril. */
  text: string;
  /** El fondo suave de su etiqueta. */
  chip: string;
}

const FALLBACK: AccentStyles = {
  rail: 'bg-primary',
  text: 'text-primary',
  chip: 'bg-primary/10 text-primary',
};

export const ACCENT_STYLES: Record<string, AccentStyles> = {
  primary: FALLBACK,
  accent: { rail: 'bg-accent', text: 'text-accent', chip: 'bg-accent/15 text-accent' },
  success: { rail: 'bg-success', text: 'text-success', chip: 'bg-success/12 text-success' },
  warning: { rail: 'bg-warning', text: 'text-warning', chip: 'bg-warning/15 text-warning' },
  destructive: {
    rail: 'bg-destructive',
    text: 'text-destructive',
    chip: 'bg-destructive/10 text-destructive',
  },
  brand: { rail: 'bg-brand', text: 'text-brand', chip: 'bg-brand/10 text-brand' },
};

export function accentStyles(accent: string): AccentStyles {
  return ACCENT_STYLES[accent] ?? FALLBACK;
}

/**
 * El mismo color en hexadecimal, para la lámina que se comparte: se rasteriza
 * a imagen y `oklch` no sobrevive a ese viaje (RFC 0002 D14).
 */
export function accentHex(accent: string, theme: ResolvedTheme = 'light'): string {
  const palette = themeColorsHex[theme];

  if (accent === 'accent') return palette.accent;
  if (accent === 'success') return palette.success;
  if (accent === 'warning') return palette.warning;
  if (accent === 'destructive') return palette.destructive;
  if (accent === 'brand') return brandColorHex;
  return palette.primary;
}
