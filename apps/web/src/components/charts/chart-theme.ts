import { themeColorsHex } from '@navis/theme';

import { useThemeStore } from '@/lib/theme';

export interface ChartTheme {
  /** El azul de los controles. Nombres de token y no de dato: esta carpeta la
      comparten profecías y sueños, y «recibidas» no significaba nada aquí. */
  primary: string;
  success: string;
  axis: string;
  track: string;
  surface: string;
}

/**
 * Los colores de los gráficos, en hexadecimal (RFC 0004 D8).
 *
 * recharts **no entiende `oklch`**, así que ni una clase de Tailwind ni un
 * hexadecimal a ojo: salen de `themeColorsHex`, que es la misma paleta que usa
 * la interfaz (Regla 3 §5).
 *
 * Se leen **en cada render** y no una vez en un módulo: si se capturasen al
 * cargar, los gráficos se quedarían con los colores del tema anterior al
 * cambiar de claro a oscuro.
 */
export function useChartTheme(): ChartTheme {
  const resolved = useThemeStore((state) => state.resolvedTheme);
  const palette = themeColorsHex[resolved];

  return {
    primary: palette.primary,
    success: palette.success,
    axis: palette.mutedForeground,
    track: palette.border,
    surface: palette.card,
  };
}
