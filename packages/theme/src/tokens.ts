import type { ResolvedTheme } from './theme-store';

/**
 * Los mismos valores que `tokens.css`, en JS, para los sitios donde no llega
 * una clase de Tailwind: barra de estado nativa, splash screen, meta
 * `theme-color` del navegador o colores de gráficos.
 *
 * Si cambias un color aquí, cámbialo también en `tokens.css`.
 */
/**
 * El azul del logo. Es el único color que NO depende del tema: es la marca,
 * igual que el fondo de los iconos de la aplicación (Regla 7). Para el azul de
 * la interfaz —que sí cambia entre claro y oscuro— está `primary`.
 *
 * Su equivalente en CSS es el token `--brand` de `tokens.css`.
 */
export const brandColorHex = '#2140cf';

export const themeColors = {
  light: {
    background: 'oklch(0.99 0.003 106)',
    foreground: 'oklch(0.22 0.01 265)',
    card: 'oklch(1 0 0)',
    primary: 'oklch(0.457 0.221 266.66)',
    primaryForeground: 'oklch(1 0 0)',
    muted: 'oklch(0.96 0.005 264)',
    mutedForeground: 'oklch(0.52 0.02 264)',
    accent: 'oklch(0.83 0.13 82)',
    destructive: 'oklch(0.58 0.21 27)',
    success: 'oklch(0.62 0.15 150)',
    warning: 'oklch(0.75 0.15 70)',
    border: 'oklch(0.91 0.008 264)',
  },
  dark: {
    background: 'oklch(0.17 0.012 265)',
    foreground: 'oklch(0.96 0.005 264)',
    card: 'oklch(0.21 0.014 265)',
    primary: 'oklch(0.54 0.221 266.66)',
    primaryForeground: 'oklch(1 0 0)',
    muted: 'oklch(0.27 0.02 265)',
    mutedForeground: 'oklch(0.7 0.02 264)',
    accent: 'oklch(0.78 0.13 82)',
    destructive: 'oklch(0.65 0.2 27)',
    success: 'oklch(0.7 0.15 150)',
    warning: 'oklch(0.8 0.14 70)',
    border: 'oklch(0.31 0.02 265)',
  },
} as const satisfies Record<ResolvedTheme, Record<string, string>>;

/**
 * La misma paleta convertida a hexadecimal sRGB.
 *
 * React Native no entiende `oklch()` y varios sitios tampoco: el `theme_color`
 * del manifest PWA, el splash de Expo, la barra de navegación de Android o el
 * prop `color` de los iconos de `@expo/vector-icons` (que no admiten
 * `className`). Se usa aquí y nunca a ojo.
 */
export const themeColorsHex = {
  light: {
    background: '#fcfcfa',
    foreground: '#181b1f',
    card: '#ffffff',
    cardForeground: '#181b1f',
    primary: '#2140cf',
    primaryForeground: '#ffffff',
    secondary: '#eef2f9',
    muted: '#f0f2f5',
    mutedForeground: '#636975',
    accent: '#f1bf5b',
    destructive: '#db2c2b',
    success: '#2e9e52',
    warning: '#e99b2a',
    border: '#dee1e7',
  },
  dark: {
    background: '#0d0f15',
    foreground: '#f0f2f5',
    card: '#15181f',
    cardForeground: '#f0f2f5',
    primary: '#355cec',
    primaryForeground: '#ffffff',
    secondary: '#222630',
    muted: '#222630',
    mutedForeground: '#989fab',
    accent: '#e1af4a',
    destructive: '#f14e46',
    success: '#4cb86a',
    warning: '#f7ac4d',
    border: '#2b303b',
  },
} as const satisfies Record<ResolvedTheme, Record<string, string>>;

/** Atajo al color de fondo, que es el que más se usa fuera de las clases. */
export const themeColorHex = {
  light: themeColorsHex.light.background,
  dark: themeColorsHex.dark.background,
} as const satisfies Record<ResolvedTheme, string>;

export const radius = {
  sm: 6,
  md: 8,
  lg: 10,
  xl: 14,
} as const;
