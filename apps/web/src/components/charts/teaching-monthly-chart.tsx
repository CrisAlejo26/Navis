import type { TeachingMonth } from '@navis/shared';
import { brandColorHex } from '@navis/theme';
import { useTranslation } from 'react-i18next';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import { useChartTheme } from '@/components/charts/chart-theme';
import { formatMonth, formatShortMonth } from '@/lib/format';

interface Punto extends TeachingMonth {
  label: string;
  full: string;
}

/**
 * Enseñanzas, mes a mes (RFC 0022 §4.4, §6).
 *
 * Una sola serie, con el azul de **marca** y no el de los controles (D8 de
 * profecías reutilizado, con una variación a propósito): es la barra que más
 * llama la atención de la portada, y esta sección lleva más color que sus
 * hermanas (§3).
 */
export function TeachingMonthlyChart({ months }: { months: TeachingMonth[] }) {
  const { t } = useTranslation();
  const theme = useChartTheme();
  const data: Punto[] = months.map((month) => ({
    ...month,
    label: formatShortMonth(month.month),
    full: formatMonth(`${month.month}-01`),
  }));

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -24 }}>
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tick={{ fill: theme.axis, fontSize: 10 }}
            minTickGap={4}
          />
          <YAxis
            allowDecimals={false}
            tickLine={false}
            axisLine={false}
            width={40}
            tick={{ fill: theme.axis, fontSize: 11 }}
          />
          <Tooltip
            cursor={{ fill: theme.track, opacity: 0.35 }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const punto = payload[0].payload as Punto;

              return (
                <div className="gap-1 px-3 py-2 text-xs shadow-md flex flex-col rounded-lg border bg-popover">
                  <span className="font-medium">{punto.full}</span>
                  <span className="text-muted-foreground tabular-nums">
                    {t('teachings.title')}: {punto.total}
                  </span>
                </div>
              );
            }}
          />
          <Bar
            dataKey="total"
            name={t('teachings.stats.monthly')}
            fill={brandColorHex}
            radius={[3, 3, 0, 0]}
            isAnimationActive={false}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
