import {
  eachDay,
  startOfWeek,
  type TagRef,
  type TaskOccurrence,
  type TaskStatsByPriority,
  type TaskStatsByTag,
  type TaskStatsWeek,
  type TaskStreakDay,
} from '@navis/shared';

/** Cuántas completadas y cuántas pendientes cayeron en cada semana del tramo. */
export function byWeek(items: TaskOccurrence[], from: string, to: string): TaskStatsWeek[] {
  const weeks = new Map<string, TaskStatsWeek>();
  for (const date of eachDay(from, to)) {
    const week = startOfWeek(date);
    if (!weeks.has(week)) weeks.set(week, { week, completed: 0, pending: 0 });
  }
  for (const item of items) {
    const week = startOfWeek(item.date);
    const bucket = weeks.get(week);
    if (!bucket) continue;
    if (item.status === 'completada') bucket.completed += 1;
    else bucket.pending += 1;
  }
  return [...weeks.values()].sort((a, b) => a.week.localeCompare(b.week));
}

export function byPriority(items: TaskOccurrence[]): TaskStatsByPriority[] {
  const counts: Record<TaskOccurrence['priority'], number> = { baja: 0, media: 0, alta: 0 };
  for (const item of items) counts[item.priority] += 1;
  return (['baja', 'media', 'alta'] as const).map((priority) => ({
    priority,
    count: counts[priority],
  }));
}

export function byTag(items: TaskOccurrence[]): TaskStatsByTag[] {
  const counts = new Map<string, TaskStatsByTag>();
  for (const item of items) {
    for (const tag of item.tags) {
      const bucket = counts.get(tag.id) ?? tagBucket(tag);
      bucket.count += 1;
      counts.set(tag.id, bucket);
    }
  }
  return [...counts.values()].sort((a, b) => b.count - a.count);
}

function tagBucket(tag: TagRef): TaskStatsByTag {
  return { tagId: tag.id, name: tag.name, icon: tag.icon, accent: tag.accent, count: 0 };
}

/** La tira de los últimos noventa días, para el Faro a escala (§9.4). */
export function streak90(items: TaskOccurrence[], from: string, to: string): TaskStreakDay[] {
  const byDate = new Map<string, TaskOccurrence[]>();
  for (const item of items) byDate.set(item.date, [...(byDate.get(item.date) ?? []), item]);

  return eachDay(from, to).map((date) => {
    const day = byDate.get(date) ?? [];
    return {
      date,
      empty: day.length === 0,
      completed: day.length > 0 && day.every((task) => task.status === 'completada'),
    };
  });
}

/** Tasa de cumplimiento semanal, para la línea de tendencia. */
export function trend(weeks: TaskStatsWeek[]): { week: string; rate: number }[] {
  return weeks.map((week) => {
    const total = week.completed + week.pending;
    return { week: week.week, rate: total === 0 ? 0 : week.completed / total };
  });
}
