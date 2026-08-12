import {
  eachDay,
  startOfWeek,
  type HabitOccurrence,
  type HabitStatsByTag,
  type HabitStatsWeek,
  type TagRef,
} from '@navis/shared';

export function byWeek(items: HabitOccurrence[], from: string, to: string): HabitStatsWeek[] {
  const weeks = new Map<string, HabitStatsWeek>();
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

export function byTag(items: HabitOccurrence[]): HabitStatsByTag[] {
  const counts = new Map<string, HabitStatsByTag>();
  for (const item of items) {
    for (const tag of item.tags) {
      const bucket = counts.get(tag.id) ?? tagBucket(tag);
      bucket.count += 1;
      counts.set(tag.id, bucket);
    }
  }
  return [...counts.values()].sort((a, b) => b.count - a.count);
}

function tagBucket(tag: TagRef): HabitStatsByTag {
  return { tagId: tag.id, name: tag.name, icon: tag.icon, accent: tag.accent, count: 0 };
}

export function trend(weeks: HabitStatsWeek[]): { week: string; rate: number }[] {
  return weeks.map((week) => {
    const total = week.completed + week.pending;
    return { week: week.week, rate: total === 0 ? 0 : week.completed / total };
  });
}
