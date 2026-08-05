import type { ProphecyMonth } from '@navis/shared';
import { useTranslation } from 'react-i18next';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import { useChartTheme } from '@/components/charts/chart-theme';
import { formatMonth, formatShortMonth } from '@/lib/format';

interface Punto extends ProphecyMonth {
  /** «05/26» para el eje: doce nombres de mes no caben. */
  label: string;
  /** «mayo de 2026» para el tooltip, donde sí hay sitio para leerlo. */
  full: string;
}

/**
 * Recibidas y cumplidas, mes a mes (RFC 0004 §7.3).
 *
 * Es el único gráfico de librería de la aplicación, y va **desnudo** a
 * propósito (D8): sin `CartesianGrid`, sin `Legend` automática, con tooltip
 * propio y ejes sin línea. Los valores por defecto de recharts son justo lo que
 * hace que un panel se reconozca a distancia (Regla 9 §2).
 */
export function MonthlyChart({ months }: { months: ProphecyMonth[] }) {
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
        <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -24 }} barGap={2}>
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
                  {/* En el tooltip sí cabe el mes con su nombre entero. */}
                  <span className="font-medium">{punto.full}</span>
                  <span className="text-muted-foreground tabular-nums">
                    {t('prophecies.stats.received')}: {punto.received}
                  </span>
                  <span className="text-muted-foreground tabular-nums">
                    {t('prophecies.stats.fulfilled')}: {punto.fulfilled}
                  </span>
                </div>
              );
            }}
          />
          {/* La animación por defecto de recharts es otro de sus rasgos
              reconocibles: se apaga y el fundido lo pone el contenedor (§7.8). */}
          <Bar
            dataKey="received"
            name={t('prophecies.stats.received')}
            fill={theme.primary}
            radius={[3, 3, 0, 0]}
            isAnimationActive={false}
          />
          <Bar
            dataKey="fulfilled"
            name={t('prophecies.stats.fulfilled')}
            fill={theme.success}
            radius={[3, 3, 0, 0]}
            isAnimationActive={false}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
