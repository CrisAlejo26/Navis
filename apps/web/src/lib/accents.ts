import { isCongregationAccent, type CongregationAccent } from '@navis/shared';
import { brandColorHex, themeColorsHex, type ResolvedTheme } from '@navis/theme';
import type { CSSProperties } from 'react';

/**
 * Cómo se pinta lo que lleva color propio: una sede en el calendario, un don en
 * la ficha de un hermano. Es la misma paleta y la misma mecánica, así que vive
 * en un solo sitio (Regla 1 §5: a la tercera se extrae).
 *
 * El color viaja en una **variable CSS propia** (`--acento`) y las clases la
 * leen. Es lo que permite llevar un color de la paleta ampliada o uno elegido a
 * mano sin que Tailwind tenga que conocerlo: `bg-${color}` no existiría, porque
 * el compilador solo ve las clases escritas.
 */
/** El carril vertical, el punto y cualquier superficie del color. */
export const ACCENT_RAIL = 'bg-[var(--acento)]';

/** El nombre escrito de su color. */
export const ACCENT_TEXT = 'text-[var(--acento)]';

export type AccentVars = CSSProperties & Record<'--acento', string>;

/**
 * Los seis colores de siempre son **tokens**, no hexadecimales: siguen
 * cambiando con el tema y cumpliendo contraste en claro y en oscuro (Regla 3).
 */
const TOKEN_VAR: Record<CongregationAccent, string> = {
  primary: 'var(--color-primary)',
  accent: 'var(--color-accent)',
  success: 'var(--color-success)',
  warning: 'var(--color-warning)',
  destructive: 'var(--color-destructive)',
  brand: 'var(--color-brand)',
};

const HEX = /^#[0-9a-fA-F]{6}$/;

/** El color tal cual lo entiende CSS. */
export function accentColor(accent: string): string {
  if (isCongregationAccent(accent)) return TOKEN_VAR[accent];
  return HEX.test(accent) ? accent : TOKEN_VAR.primary;
}

export function accentVars(accent: string): AccentVars {
  return { '--acento': accentColor(accent) };
}

/**
 * El mismo color en hexadecimal, para la lámina que se comparte: se rasteriza
 * a imagen y ni `oklch` ni una variable sobreviven a ese viaje (RFC 0002 D14).
 */
export function accentHex(accent: string, theme: ResolvedTheme = 'light'): string {
  if (HEX.test(accent)) return accent;

  const palette = themeColorsHex[theme];

  if (accent === 'accent') return palette.accent;
  if (accent === 'success') return palette.success;
  if (accent === 'warning') return palette.warning;
  if (accent === 'destructive') return palette.destructive;
  if (accent === 'brand') return brandColorHex;
  return palette.primary;
}
