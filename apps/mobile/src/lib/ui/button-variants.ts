import type { ThemeColors } from '@navis/theme';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive' | 'outline' | 'link';
export type ButtonSize = 'sm' | 'md' | 'lg';

/**
 * Fondo y borde de cada variante — compartido por `Button` e `IconButton`
 * (Fase 3, `docs/sistema-componentes-movil-plan.md`). `outline` y `link` no
 * llevaban tono de fondo hasta ahora.
 */
export const BUTTON_CONTAINERS: Record<ButtonVariant, string> = {
  primary: 'bg-primary',
  secondary: 'bg-secondary',
  ghost: 'bg-transparent',
  destructive: 'bg-destructive',
  outline: 'bg-transparent border border-input',
  link: 'bg-transparent',
};

export const BUTTON_LABELS: Record<ButtonVariant, string> = {
  primary: 'text-primary-foreground',
  secondary: 'text-secondary-foreground',
  ghost: 'text-foreground',
  destructive: 'text-destructive-foreground',
  outline: 'text-foreground',
  link: 'text-primary underline',
};

export const BUTTON_SIZES: Record<ButtonSize, string> = {
  sm: 'h-9 px-3',
  md: 'h-11 px-4',
  lg: 'h-13 px-6',
};

/**
 * Qué clave de `themeColorsHex` da el color de un icono decorativo dentro del
 * botón: los iconos de `@expo/vector-icons` no aceptan `className` (Regla 3
 * §5), así que el tono tiene que resolverse en hexadecimal y coincidir con el
 * de `BUTTON_LABELS` para esa misma variante.
 */
export const BUTTON_ICON_TONE: Record<ButtonVariant, keyof ThemeColors> = {
  primary: 'primaryForeground',
  secondary: 'secondaryForeground',
  ghost: 'foreground',
  destructive: 'destructiveForeground',
  outline: 'foreground',
  link: 'primary',
};
