import { themeColorsHex } from '@navis/theme';
import { View } from 'react-native';
import { LineChart as GiftedLineChart } from 'react-native-gifted-charts';

import { hexAlpha } from '@/lib/color';
import { useThemeStore } from '@/lib/theme';
import { useChartWidth } from '@/lib/ui/chart-width';
import { chartTheme } from '@/lib/ui/chart-theme';

export interface LineChartPoint {
    value: number;
    label: string;
}

interface LineChartProps {
    data: readonly LineChartPoint[];
    height?: number;
    maxValue?: number;
    /** Relleno suave bajo la línea (degradado del token `--primary`, Regla 3). */
    area?: boolean;
    /** Puntos marcados sobre la línea. */
    showDataPoints?: boolean;
    /** Mini gráfica sin ejes ni etiquetas, para dentro de un `StatCard`. */
    sparkline?: boolean;
    /** Straight segments avoid overshooting bounded values such as percentages. */
    curved?: boolean;
    endSpacing?: number;
}

/**
 * Gráfica de línea (Fase 11 de `docs/planes/implementados/sistema-componentes-movil-plan.md`),
 * envuelta sobre `react-native-gifted-charts` (la librería ya estaba en
 * `apps/mobile`): la línea en `--primary`, ejes y reglas en `--border`,
 * etiquetas en `--muted-foreground` — resueltos desde el tema, como el resto
 * de componentes. `sparkline` no es otro componente: es esta misma con los
 * ejes ocultos y sin etiquetas de datos (Regla 1 punto 4).
 */
export function LineChart({
    data,
    height = 160,
    maxValue,
    area = false,
    showDataPoints = false,
    sparkline = false,
    curved = true,
    endSpacing,
}: LineChartProps) {
    const palette = themeColorsHex[useThemeStore((state) => state.resolvedTheme)];
    const theme = chartTheme(palette);
    const chart = useChartWidth();

    return (
        <View onLayout={chart.onLayout}>
            <GiftedLineChart
                data={data.map((point) => (sparkline ? { value: point.value } : point))}
                width={chart.width}
                parentWidth={chart.parentWidth}
                height={height}
                adjustToWidth
                endSpacing={endSpacing}
                spacing={
                    endSpacing === undefined
                        ? undefined
                        : Math.max(
                              0,
                              (chart.width - 20 - endSpacing) / Math.max(data.length - 1, 1),
                          )
                }
                disableScroll
                curved={curved}
                thickness={sparkline ? 2 : 2.5}
                color={theme.line}
                areaChart={area}
                startFillColor={hexAlpha(theme.line, 0.18)}
                endFillColor={hexAlpha(theme.line, 0.02)}
                dataPointsRadius={showDataPoints ? 3 : undefined}
                dataPointsColor={theme.line}
                hideAxesAndRules={sparkline}
                hideYAxisText={sparkline}
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
        </View>
    );
}
