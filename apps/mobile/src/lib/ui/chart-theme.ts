import { FONT_FAMILIES, type ThemeColors } from '@navis/theme';

export interface ChartTheme {
  /** Color de la línea / barras: `--primary`. */
  line: string;
  /** Color de ejes y reglas: `--border`. */
  axis: string;
  /** Color del texto de los ejes: `--muted-foreground`. */
  label: string;
  /** La familia de cuerpo, para los textos que la librería pinta por su cuenta. */
  font: string;
}

/**
 * Los colores de las gráficas (Fase 11 de
 * `docs/sistema-componentes-movil-plan.md`) salen todos de los tokens — nunca
 * de un valor suelto (Regla 3): `react-native-gifted-charts` pinta ejes,
 * reglas y etiquetas con props propios que no aceptan `className`, así que
 * necesitan el hexadecimal, resuelto aquí una sola vez.
 */
export function chartTheme(palette: ThemeColors): ChartTheme {
  return {
    line: palette.primary,
    axis: palette.border,
    label: palette.mutedForeground,
    font: FONT_FAMILIES.sans.native,
  };
}
