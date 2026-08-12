import type { TaskStatsWeek } from '@navis/shared';
import { useTranslation } from 'react-i18next';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import { useChartTheme } from '@/components/charts/chart-theme';
import { formatDay } from '@/lib/format';

interface Punto extends TaskStatsWeek {
  label: string;
}

/** Completadas frente a pendientes, semana a semana (RFC 0018 §9.4). Mismo estilo desnudo que `MonthlyChart`. */
export function TaskWeeklyChart({ weeks }: { weeks: TaskStatsWeek[] }) {
  const { t } = useTranslation();
  const theme = useChartTheme();
  const data: Punto[] = weeks.map((week) => ({ ...week, label: formatDay(week.week, 'short') }));

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
            width={32}
            tick={{ fill: theme.axis, fontSize: 11 }}
          />
          <Tooltip
            cursor={{ fill: theme.track, opacity: 0.35 }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const punto = payload[0].payload as Punto;

              return (
                <div className="gap-1 px-3 py-2 text-xs shadow-md flex flex-col rounded-lg border bg-popover">
                  <span className="font-medium">{punto.label}</span>
                  <span className="text-muted-foreground tabular-nums">
                    {t('tasks.statusDone')}: {punto.completed}
                  </span>
                  <span className="text-muted-foreground tabular-nums">
                    {t('tasks.statusPending')}: {punto.pending}
                  </span>
                </div>
              );
            }}
          />
          <Bar
            dataKey="completed"
            stackId="week"
            name={t('tasks.statusDone')}
            fill={theme.success}
            radius={[3, 3, 0, 0]}
            isAnimationActive={false}
          />
          <Bar
            dataKey="pending"
            stackId="week"
            name={t('tasks.statusPending')}
            fill={theme.track}
            radius={[3, 3, 0, 0]}
            isAnimationActive={false}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
