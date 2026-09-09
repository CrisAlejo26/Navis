import { themeColorsHex, type ThemeColors } from '@navis/theme';
import type { ReactNode } from 'react';
import { PieChart as GiftedPieChart } from 'react-native-gifted-charts';

import { useThemeStore } from '@/lib/theme';

export type DonutTone = 'primary' | 'success' | 'warning' | 'destructive' | 'accent' | 'muted';

const TONE_KEY: Record<DonutTone, keyof ThemeColors> = {
  primary: 'primary',
  success: 'success',
  warning: 'warning',
  destructive: 'destructive',
  accent: 'accent',
  muted: 'mutedForeground',
};

export interface DonutSegment {
  value: number;
  tone: DonutTone;
}

interface DonutChartProps {
  data: readonly DonutSegment[];
  size?: number;
  /** El grosor del anillo. */
  strokeWidth?: number;
  /** Lo que va en el centro del donut (un total, una etiqueta…). */
  centerLabel?: ReactNode;
}

/**
 * Donut de desglose (Fase 11): un total dividido en tonos semánticos, con el
 * resumen en el centro. Los colores salen de los tokens — quien lo usa pasa
 * un `tone`, no un hex suelto (Regla 3).
 */
export function DonutChart({ data, size = 120, strokeWidth = 22, centerLabel }: DonutChartProps) {
  const palette = themeColorsHex[useThemeStore((state) => state.resolvedTheme)];

  const segments = data.map((segment) => ({
    value: segment.value,
    color: palette[TONE_KEY[segment.tone]],
  }));

  return (
    <GiftedPieChart
      data={segments}
      donut
      radius={size / 2}
      innerRadius={(size - strokeWidth * 2) / 2}
      strokeWidth={0}
      innerCircleColor={palette.card}
      centerLabelComponent={centerLabel ? () => centerLabel : undefined}
      isAnimated
    />
  );
}
