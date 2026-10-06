import {
    addDays,
    STREAK_STATS_DAYS,
    taskByWeek,
    taskByPriority,
    taskByTag,
    taskTrend,
    taskStreak90,
    habitByWeek,
    habitByTag,
    habitTrend,
    type TaskStats,
    type HabitStats,
} from '@navis/shared';
import { taskRange, taskStreak } from './tasks-reads';
import { habitRange } from './habits-reads';
import type { TasksContext } from './tasks-context';

/** Same contract and shared calculations as the API statistics services. */
export async function taskStatistics(
    context: TasksContext,
    today: string,
    from: string,
    to: string,
): Promise<TaskStats> {
    const since = addDays(today, -(STREAK_STATS_DAYS - 1));
    // Local transactions must not overlap when the streak cache is written.
    const items = await taskRange(context, from, to);
    const history = await taskRange(context, since, today);
    const streak = await taskStreak(context, today);
    const weeks = taskByWeek(items, from, to);
    return {
        byWeek: weeks,
        byPriority: taskByPriority(items),
        byTag: taskByTag(items),
        trend: taskTrend(weeks),
        streak90: taskStreak90(history, since, today),
        currentStreak: streak.current,
        longestStreak: streak.longest,
    };
}
export async function habitStatistics(
    context: TasksContext,
    from: string,
    to: string,
): Promise<HabitStats> {
    const items = await habitRange(context, from, to),
        weeks = habitByWeek(items, from, to);
    return { byWeek: weeks, byTag: habitByTag(items), trend: habitTrend(weeks) };
}
