import type { JournalMonth } from '@navis/shared';
import { useTranslation } from 'react-i18next';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import { useChartTheme } from '@/components/charts/chart-theme';
import { formatMonth, formatShortMonth } from '@/lib/format';

interface Punto extends JournalMonth {
  /** «05/26» para el eje: doce nombres de mes no caben. */
  label: string;
  /** «mayo de 2026» para el tooltip, donde sí hay sitio para leerlo. */
  full: string;
}

/**
 * Entradas del cuaderno, mes a mes (RFC 0017 §7.3).
 *
 * Una sola serie, al revés que el de profecías: aquí no hay dos fechas que
 * comparar, solo cuántas entradas hubo. Va **desnudo**, con el mismo criterio
 * que `MonthlyChart` (D8): sin `CartesianGrid`, tooltip propio, ejes sin
 * línea.
 */
export function JournalMonthlyChart({ months }: { months: JournalMonth[] }) {
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
                    {t('journal.stats.total')}: {punto.total}
                  </span>
                </div>
              );
            }}
          />
          <Bar
            dataKey="total"
            name={t('journal.stats.monthly')}
            fill={theme.primary}
            radius={[3, 3, 0, 0]}
            isAnimationActive={false}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
