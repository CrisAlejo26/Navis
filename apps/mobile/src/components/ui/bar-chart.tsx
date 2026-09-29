import { themeColorsHex } from '@navis/theme';
import { View } from 'react-native';
import { BarChart as GiftedBarChart } from 'react-native-gifted-charts';

import { useThemeStore } from '@/lib/theme';
import { useChartWidth } from '@/lib/ui/chart-width';
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
    /** Más pequeña cuando las etiquetas son de tres letras y hay doce barras. */
    labelFontSize?: number;
}

/**
 * Gráfica de barras (Fase 11), la compañera de `LineChart` sobre
 * `react-native-gifted-charts`: barras en `--primary` con la esquina superior
 * redondeada (una barra cuadrada no es Navis), ejes y etiquetas de los mismos
 * tokens. Sin degradado de relleno (Regla 9).
 */
export function BarChart({
    data,
    height = 160,
    maxValue,
    showValues = false,
    labelFontSize = 11,
}: BarChartProps) {
    const palette = themeColorsHex[useThemeStore((state) => state.resolvedTheme)];
    const theme = chartTheme(palette);
    const chart = useChartWidth();

    return (
        <View onLayout={chart.onLayout}>
            <GiftedBarChart
                data={[...data]}
                width={chart.width}
                parentWidth={chart.parentWidth}
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
                xAxisLabelTextStyle={{
                    color: theme.label,
                    fontSize: labelFontSize,
                    fontFamily: theme.font,
                }}
                formatYLabel={(label) => Math.round(Number(label)).toString()}
                maxValue={maxValue}
            />
        </View>
    );
}
