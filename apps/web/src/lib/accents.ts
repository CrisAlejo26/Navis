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

export type AccentVars = CSSProperties & Record<'--acento' | '--acento-fg', string>;

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
  return { '--acento': accentColor(accent), '--acento-fg': accentForeground(accent) };
}

/** El `-foreground` de los seis tokens de siempre, que sí lo traen puesto. */
const TOKEN_FOREGROUND: Record<CongregationAccent, string> = {
  primary: 'var(--color-primary-foreground)',
  accent: 'var(--color-accent-foreground)',
  success: 'var(--color-success-foreground)',
  warning: 'var(--color-warning-foreground)',
  destructive: 'var(--color-destructive-foreground)',
  brand: 'var(--color-brand-foreground)',
};

/**
 * El color del texto sobre una **superficie rellena** de ese acento.
 *
 * Un fondo sin su texto es la forma más rápida de quedarse sin contraste
 * (Regla 3 §2), y los dieciséis de la paleta ampliada son hexadecimales sueltos
 * que no traen pareja. Se calcula de su luminancia y **no cambia con el tema**,
 * igual que el color: el panel del tablón es del color de la lista en claro y en
 * oscuro (RFC 0010 D37, Regla 3 §6).
 */
export function accentForeground(accent: string): string {
  if (isCongregationAccent(accent)) return TOKEN_FOREGROUND[accent];
  if (!HEX.test(accent)) return TOKEN_FOREGROUND.primary;

  return luminance(accent) > 0.45 ? '#101728' : '#ffffff';
}

/** Luminancia relativa (WCAG), que es lo que decide si el texto va claro u oscuro. */
function luminance(hex: string): number {
  const canal = (from: number) => {
    const value = Number.parseInt(hex.slice(from, from + 2), 16) / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  };

  return 0.2126 * canal(1) + 0.7152 * canal(3) + 0.0722 * canal(5);
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
