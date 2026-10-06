import { useState } from 'react';
import { addDays, eachDay, todayIn } from '@navis/shared';
import { useListContext } from '@/hooks/use-lists';
import { useActivityStats } from '@/hooks/use-activity-stats';
import { useTaskRange } from '@/hooks/use-tasks';
import { useHabitRange } from '@/hooks/use-habits';
import { useActivityCalendar } from '@/hooks/use-activities';
import { defaultFilters } from '@/lib/tasks/filters';
import { statisticsDayLabel } from './statistics-day-label';
import { getLocale } from '@/lib/i18n';

export function useTaskStatistics() {
    const scope = useListContext(),
        today = todayIn(scope.church?.timezone ?? 'UTC');
    const [period, setPeriod] = useState<'week' | 'month'>('week');
    const [kind, setKind] = useState<'task' | 'habit'>('task');
    const from = addDays(today, period === 'week' ? -6 : -29),
        to = today;
    const query = useActivityStats(today, from, to);
    const tasks = useTaskRange(from, to),
        habits = useHabitRange(from, to);
    const todayQuery = useActivityCalendar(defaultFilters(), today, true, {
        from: today,
        to: today,
    });
    const stats = kind === 'task' ? query.data?.tasks : query.data?.habits;
    const completed = stats?.byWeek.reduce((sum, week) => sum + week.completed, 0) ?? 0;
    const pending = stats?.byWeek.reduce((sum, week) => sum + week.pending, 0) ?? 0;
    const items = kind === 'task' ? (tasks.data ?? []) : (habits.data ?? []);
    const bars =
        period === 'week'
            ? eachDay(from, to).map((date) => ({
                  label: new Intl.DateTimeFormat(getLocale(), {
                      weekday: 'short',
                      timeZone: 'UTC',
                  }).format(new Date(`${date}T12:00:00Z`)),
                  value: items.filter((item) => item.date === date && item.status === 'completada')
                      .length,
              }))
            : (stats?.byWeek ?? []).map((week) => ({
                  label: statisticsDayLabel(week.week),
                  value: week.completed,
              }));
    return {
        scope,
        today,
        from,
        to,
        period,
        setPeriod,
        kind,
        setKind,
        query,
        todayQuery,
        stats,
        completed,
        pending,
        bars,
        total: completed + pending,
        rate: completed + pending ? Math.round((100 * completed) / (completed + pending)) : 0,
        pendingData: query.isPending || tasks.isPending || habits.isPending || todayQuery.isPending,
        error: query.isError || tasks.isError || habits.isError || todayQuery.isError,
        retry: () => {
            void query.refetch();
            void tasks.refetch();
            void habits.refetch();
            void todayQuery.refetch();
        },
    };
}
export type TaskStatisticsState = ReturnType<typeof useTaskStatistics>;
