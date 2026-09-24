import type { ProphecyMonth } from '@navis/shared';
import { themeColorsHex } from '@navis/theme';
import { useState } from 'react';
import { Text, View, type LayoutChangeEvent } from 'react-native';
import { BarChart as GiftedBarChart } from 'react-native-gifted-charts';
import { useTranslation } from 'react-i18next';

import { useThemeStore } from '@/lib/theme';
import { chartTheme } from '@/lib/ui/chart-theme';

interface ProphecyMonthlyChartProps {
    monthly: readonly ProphecyMonth[];
}

const MONTH_FORMATTER = new Intl.DateTimeFormat(undefined, { month: 'short', timeZone: 'UTC' });

/**
 * Con dos barras por mes (recibidas, cumplidas), doce meses son 24 barras: el
 * ancho de barra que calcula `adjustToWidth` por sí solo asume que el
 * espaciado entre barras también sale de su propia cuenta, pero aquí cada
 * dato lleva su **propio** `spacing` (2 dentro del mes, el salto mayor entre
 * uno y el siguiente) para separar los grupos — y ese espaciado a medida no
 * entra en la cuenta de `adjustToWidth`, así que el resultado se salía de la
 * pantalla. Con el espaciado fijo, el ancho de barra se calcula aquí a mano
 * para que la suma cuadre con el ancho medido del contenedor.
 */
const MONTHS = 12;
const BARS_PER_MONTH = 2;
const INNER_SPACING = 2;
const GROUP_SPACING = 8;
const Y_AXIS_WIDTH = 30;
const EDGE_SPACING = 6;

/**
 * Cumplimiento mes a mes, dos series (docs/profecias-movil-plan.md §4.6): sin
 * primitiva de dos series en `components/ui` todavía —es el primer caso—, así
 * que se construye aquí, sobre el soporte de barras agrupadas de
 * `react-native-gifted-charts`: dos barras juntas por mes (recibidas,
 * cumplidas) y un salto mayor antes del siguiente mes.
 */
export function ProphecyMonthlyChart({ monthly }: ProphecyMonthlyChartProps) {
    const { t } = useTranslation();
    const palette = themeColorsHex[useThemeStore((state) => state.resolvedTheme)];
    const theme = chartTheme(palette);
    const [width, setWidth] = useState(0);
    const onLayout = (event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width);

    const totalBars = MONTHS * BARS_PER_MONTH;
    const totalSpacing = MONTHS * (INNER_SPACING + GROUP_SPACING);
    const barWidth = Math.max(
        4,
        (width - Y_AXIS_WIDTH - EDGE_SPACING * 2 - totalSpacing) / totalBars,
    );

    const data = monthly.flatMap((month) => [
        {
            value: month.received,
            frontColor: palette.border,
            spacing: INNER_SPACING,
        },
        {
            value: month.fulfilled,
            frontColor: palette.success,
            spacing: GROUP_SPACING,
            label: MONTH_FORMATTER.format(new Date(`${month.month}-01T00:00:00Z`)),
        },
    ]);

    return (
        <View className="gap-2" onLayout={onLayout}>
            <Text className="text-sm font-sans-medium text-foreground">
                {t('prophecies.stats.monthly')}
            </Text>
            <View className="gap-3 flex-row items-center">
                <Legend color={palette.border} label={t('prophecies.stats.received')} />
                <Legend color={palette.success} label={t('prophecies.stats.fulfilled')} />
            </View>
            {width === 0 ? null : (
                <GiftedBarChart
                    data={data}
                    width={width}
                    height={160}
                    barWidth={barWidth}
                    initialSpacing={EDGE_SPACING}
                    endSpacing={EDGE_SPACING}
                    yAxisLabelWidth={Y_AXIS_WIDTH}
                    disableScroll
                    barBorderTopLeftRadius={3}
                    barBorderTopRightRadius={3}
                    isAnimated
                    animationDuration={400}
                    noOfSections={3}
                    rulesColor={theme.axis}
                    rulesType="solid"
                    yAxisColor={theme.axis}
                    xAxisColor={theme.axis}
                    yAxisTextStyle={{ color: theme.label, fontSize: 10, fontFamily: theme.font }}
                    xAxisLabelTextStyle={{
                        color: theme.label,
                        fontSize: 9,
                        fontFamily: theme.font,
                    }}
                    formatYLabel={(label) => Math.round(Number(label)).toString()}
                />
            )}
        </View>
    );
}

function Legend({ color, label }: { color: string; label: string }) {
    return (
        <View className="gap-1.5 flex-row items-center">
            <View className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
            <Text className="text-xs text-muted-foreground">{label}</Text>
        </View>
    );
}
