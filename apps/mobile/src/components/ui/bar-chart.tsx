import { themeColorsHex } from '@navis/theme';
import { BarChart as GiftedBarChart } from 'react-native-gifted-charts';

import { useThemeStore } from '@/lib/theme';
import { chartTheme } from '@/lib/ui/chart-theme';

export interface BarChartPoint {
  value: number;
  label: string;
}

interface BarChartProps {
  data: readonly BarChartPoint[];
  height?: number;
  maxValue?: number;
  /** El valor encima de cada barra. */
  showValues?: boolean;
}

/**
 * Gráfica de barras (Fase 11), la compañera de `LineChart` sobre
 * `react-native-gifted-charts`: barras en `--primary` con la esquina superior
 * redondeada (una barra cuadrada no es Navis), ejes y etiquetas de los mismos
 * tokens. Sin degradado de relleno (Regla 9).
 */
export function BarChart({ data, height = 160, maxValue, showValues = false }: BarChartProps) {
  const palette = themeColorsHex[useThemeStore((state) => state.resolvedTheme)];
  const theme = chartTheme(palette);

  return (
    <GiftedBarChart
      data={[...data]}
      width={100}
      height={height}
      adjustToWidth
      disableScroll
      frontColor={theme.line}
      barBorderTopLeftRadius={4}
      barBorderTopRightRadius={4}
      isAnimated
      animationDuration={400}
      showValuesAsTopLabel={showValues}
      topLabelTextStyle={{ color: theme.label, fontSize: 10, fontFamily: theme.font }}
      noOfSections={3}
      rulesColor={theme.axis}
      rulesType="solid"
      yAxisColor={theme.axis}
      xAxisColor={theme.axis}
      yAxisTextStyle={{ color: theme.label, fontSize: 10, fontFamily: theme.font }}
      xAxisLabelTextStyle={{ color: theme.label, fontSize: 11, fontFamily: theme.font }}
      formatYLabel={(label) => Math.round(Number(label)).toString()}
      maxValue={maxValue}
    />
  );
}
