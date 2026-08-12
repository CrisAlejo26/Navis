import { Suspense } from 'react';
import { useTranslation } from 'react-i18next';

import { RateRing, Sparkline, TaskWeeklyChart } from '@/components/charts/lazy';
import { Faro } from '@/components/tasks/faro';
import { PriorityBars } from '@/components/tasks/priority-bars';
import { StreakGrid } from '@/components/tasks/streak-grid';
import { TagBars } from '@/components/tasks/tag-bars';
import { Card, CardTitle } from '@/components/ui/card';
import { PageSkeleton } from '@/components/ui/page-skeleton';
import { cn } from '@/lib/cn';
import { STATS_RANGES, useStatsScreen, type StatsRange } from '@/lib/tasks/use-stats-screen';

const RANGE_KEY: Record<StatsRange, string> = {
  week: 'tasks.statsRangeWeek',
  month: 'tasks.statsRangeMonth',
  quarter: 'tasks.statsRangeQuarter',
  year: 'tasks.statsRangeYear',
};

/** «Estadísticas» (RFC 0018 §9.4): las cuentas de tareas y hábitos. */
export function TasksStatsPage() {
  const { t } = useTranslation();
  const screen = useStatsScreen();

  if (screen.isLoading || !screen.stats) return <PageSkeleton />;
  const { stats } = screen;
  const rate = stats.byWeek.reduce((sum, week) => sum + week.completed, 0);
  const total = rate + stats.byWeek.reduce((sum, week) => sum + week.pending, 0);

  return (
    <section className="gap-6 animate-page-in flex flex-col">
      <header className="gap-4 flex flex-wrap items-center justify-between">
        <h1 className="text-lg font-semibold">{t('tasks.stats')}</h1>
        <div className="gap-1 p-1 flex rounded-full border bg-muted/40">
          {STATS_RANGES.map((range) => (
            <button
              key={range}
              type="button"
              onClick={() => {
                screen.setRange(range);
              }}
              aria-pressed={screen.range === range}
              className={cn(
                'px-3 h-8 text-xs font-medium cursor-pointer rounded-full transition-colors',
                screen.range === range
                  ? 'shadow-sm bg-card'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {t(RANGE_KEY[range])}
            </button>
          ))}
        </div>
      </header>

      <div className="gap-4 sm:grid-cols-2 grid">
        <Card className="gap-4 flex items-center">
          <Faro days={stats.currentStreak} />
          <div className="gap-1 flex flex-col">
            <p className="text-2xl font-bold tabular-nums">{stats.currentStreak}</p>
            <p className="text-xs text-muted-foreground">{t('tasks.statsStreakCurrent')}</p>
            <p className="mt-2 text-lg font-semibold tabular-nums">{stats.longestStreak}</p>
            <p className="text-xs text-muted-foreground">{t('tasks.statsStreakBest')}</p>
          </div>
        </Card>

        <Card className="gap-3 flex flex-col justify-center">
          <CardTitle className="text-sm">{t('tasks.statsTrend')}</CardTitle>
          <Suspense fallback={<div className="h-6" />}>
            <Sparkline values={stats.trend.map((point) => point.rate * 100)} />
          </Suspense>
          <Suspense fallback={null}>
            <div className="gap-3 flex items-center">
              <RateRing rate={total === 0 ? null : rate / total} />
              <span className="text-sm text-muted-foreground">
                {t('tasks.statsCompletedVsPending')}
              </span>
            </div>
          </Suspense>
        </Card>
      </div>

      <Card className="gap-3 flex flex-col">
        <CardTitle className="text-sm">{t('tasks.statsCompletedVsPending')}</CardTitle>
        <Suspense fallback={<PageSkeleton />}>
          <TaskWeeklyChart weeks={stats.byWeek} />
        </Suspense>
      </Card>

      <div className="gap-4 sm:grid-cols-2 grid">
        <Card className="gap-3 flex flex-col">
          <CardTitle className="text-sm">{t('tasks.statsByPriority')}</CardTitle>
          <PriorityBars data={stats.byPriority} />
        </Card>

        <Card className="gap-3 flex flex-col">
          <CardTitle className="text-sm">{t('tasks.statsByTag')}</CardTitle>
          <TagBars data={stats.byTag} />
        </Card>
      </div>

      <Card className="gap-3 flex flex-col">
        <CardTitle className="text-sm">{t('tasks.streak')}</CardTitle>
        <StreakGrid days={stats.streak90} />
      </Card>
    </section>
  );
}
