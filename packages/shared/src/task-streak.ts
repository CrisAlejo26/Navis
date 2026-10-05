import { addDays } from './dates';
import { STREAK_LOOKBACK_DAYS } from './schemas/task-queries';
import type { TaskOccurrence } from './schemas/tasks';

export function currentTaskStreak(occurrences: TaskOccurrence[], today: string): number {
    const byDate = new Map<string, TaskOccurrence[]>();
    for (const occurrence of occurrences) {
        byDate.set(occurrence.date, [...(byDate.get(occurrence.date) ?? []), occurrence]);
    }

    let streak = 0;
    let date = addDays(today, -1);
    for (let step = 0; step < STREAK_LOOKBACK_DAYS; step += 1) {
        const day = byDate.get(date) ?? [];
        if (day.length === 0) {
            date = addDays(date, -1);
            continue;
        }
        if (day.every((task) => task.status === 'completada')) {
            streak += 1;
            date = addDays(date, -1);
            continue;
        }
        break;
    }

    const todayView = byDate.get(today) ?? [];
    if (todayView.length > 0 && todayView.every((task) => task.status === 'completada')) {
        streak += 1;
    }

    return streak;
}
