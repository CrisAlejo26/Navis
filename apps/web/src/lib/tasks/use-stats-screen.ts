import { useTaskStats } from '@navis/api-client';
import { addDays, todayIn } from '@navis/shared';
import { useState } from 'react';

import { api } from '@/lib/api';

export const STATS_RANGES = ['week', 'month', 'quarter', 'year'] as const;
export type StatsRange = (typeof STATS_RANGES)[number];

const DAYS_BACK: Record<StatsRange, number> = { week: 7, month: 30, quarter: 90, year: 365 };

/** Todo lo que necesita «Estadísticas» (RFC 0018 §9.4): el rango y las series. */
export function useStatsScreen() {
  const today = todayIn(Intl.DateTimeFormat().resolvedOptions().timeZone);
  const [range, setRange] = useState<StatsRange>('month');

  const from = addDays(today, -DAYS_BACK[range]);
  const stats = useTaskStats(api, { from, to: today });

  return { range, setRange, today, stats: stats.data, isLoading: stats.isLoading };
}
