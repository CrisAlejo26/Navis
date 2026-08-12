import { useHabits, useTaskStats, useTasks, useTaskStreak } from '@navis/api-client';
import { addDays, todayIn, type HabitOccurrence, type TaskOccurrence } from '@navis/shared';
import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';

import { api } from '@/lib/api';
import { timeSlotOf } from '@/lib/tasks/task-format';

export type TodayTab = 'tasks' | 'habits';
export type QuickFilter = 'pending' | 'done' | 'morning' | 'afternoon' | 'evening';

/**
 * Todo lo que necesita la portada «Hoy» (RFC 0018 §9.3): el día elegido y la
 * pestaña viven en la URL —así el enlace de la tarjeta del panel de inicio
 * lleva a un día concreto—, y las pastillas rápidas son estado local: se
 * filtra sobre lo ya traído, sin ida y vuelta al servidor por cada clic.
 */
export function useTodayScreen() {
  const [params, setParams] = useSearchParams();
  const today = todayIn(Intl.DateTimeFormat().resolvedOptions().timeZone);

  const date = params.get('date') ?? today;
  const tab: TodayTab = params.get('tab') === 'habits' ? 'habits' : 'tasks';
  const [quick, setQuick] = useState<Set<QuickFilter>>(() => new Set(['pending']));

  const setDate = (next: string) => {
    setParams(
      (previous) => {
        const params2 = new URLSearchParams(previous);
        params2.set('date', next);
        return params2;
      },
      { replace: true },
    );
  };

  const setTab = (next: TodayTab) => {
    setParams(
      (previous) => {
        const params2 = new URLSearchParams(previous);
        params2.set('tab', next);
        return params2;
      },
      { replace: true },
    );
  };

  const toggleQuick = (filter: QuickFilter) => {
    setQuick((previous) => {
      const next = new Set(previous);
      if (next.has(filter)) next.delete(filter);
      else next.add(filter);
      return next;
    });
  };

  const tasks = useTasks(api, { from: date, to: date, hideCompleted: false, limit: 100 });
  const habits = useHabits(api, { from: date, to: date, hideCompleted: false, limit: 100 });
  const streak = useTaskStreak(api, date <= today);
  // Se pide el rango completo para tener la tira de 90 días; aquí solo se usan
  // los últimos catorce (§9.3).
  const stats = useTaskStats(api, { from: date, to: date }, tab === 'tasks' && date <= today);

  const strip14 = useMemo(() => (stats.data?.streak90 ?? []).slice(-14), [stats.data]);

  const filteredTasks = useMemo(
    () =>
      (tasks.data?.items ?? []).filter((item) =>
        matchesQuick(quick, item.status === 'completada', item.time),
      ),
    [tasks.data, quick],
  );
  const filteredHabits = useMemo(
    () =>
      (habits.data?.items ?? []).filter((item) =>
        matchesQuick(quick, item.status === 'completada', item.time),
      ),
    [habits.data, quick],
  );

  return {
    date,
    today,
    tab,
    quick,
    setDate,
    goToday: () => {
      setDate(today);
    },
    goPreviousDay: () => {
      setDate(addDays(date, -1));
    },
    goNextDay: () => {
      setDate(addDays(date, 1));
    },
    setTab,
    toggleQuick,
    tasks: filteredTasks,
    habits: filteredHabits,
    hasAnyTask: (tasks.data?.items.length ?? 0) > 0,
    hasAnyHabit: (habits.data?.items.length ?? 0) > 0,
    streak: streak.data,
    strip14,
    isLoading: tab === 'tasks' ? tasks.isLoading : habits.isLoading,
  };
}

function matchesQuick(quick: Set<QuickFilter>, completed: boolean, time: string | null): boolean {
  const statusFilters: QuickFilter[] = ['pending', 'done'];
  const activeStatus = statusFilters.filter((one) => quick.has(one));
  if (activeStatus.length > 0) {
    const ok = activeStatus.some((one) => (one === 'done' ? completed : !completed));
    if (!ok) return false;
  }

  const slotFilters: QuickFilter[] = ['morning', 'afternoon', 'evening'];
  const activeSlots = slotFilters.filter((one) => quick.has(one));
  if (activeSlots.length > 0) {
    const slot = timeSlotOf(time);
    if (!slot || !activeSlots.includes(slot)) return false;
  }

  return true;
}

export type { TaskOccurrence, HabitOccurrence };
