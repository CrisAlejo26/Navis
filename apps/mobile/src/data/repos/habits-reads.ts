import {
    addDays,
    eachDay,
    habitAppliesOn,
    type HabitOccurrence,
    type HabitStatus,
    type Paginated,
} from '@navis/shared';
import { tasksDb, type TasksContext } from './tasks-context';
import { habitRecords } from './task-records';
import { activityOccurrences } from './activity-occurrences';
import { activityPage, checkActivityRange, compare, type ActivityQuery } from './activity-query';

export async function habitRange(
    context: TasksContext,
    from: string,
    to: string,
): Promise<HabitOccurrence[]> {
    checkActivityRange(from, to);
    const db = await tasksDb(context),
        materialized = await activityOccurrences(db, context, 'habit', from, to);
    const result: HabitOccurrence[] = [];
    for (let offset = 0; ; offset += 100) {
        const templates = await habitRecords(db, context, {
            from,
            to,
            history: true,
            limit: 100,
            offset,
        });
        for (const habit of templates)
            for (const date of eachDay(from, to)) {
                if (!habitAppliesOn(habit, date)) continue;
                const isRecurring = habit.repeatFreq !== 'ninguna',
                    row = isRecurring ? materialized.get(`${habit.id}:${date}`) : undefined;
                if (habit.deletedAt && isRecurring && !row) continue;
                result.push({
                    habitId: habit.id,
                    date,
                    title: habit.title,
                    description: habit.description,
                    goal: habit.goal,
                    time: habit.time,
                    status: (isRecurring
                        ? (row?.status ?? 'pendiente')
                        : (habit.status ?? 'pendiente')) as HabitStatus,
                    completedAt: isRecurring ? (row?.completedAt ?? null) : habit.completedAt,
                    isRecurring,
                    tags: habit.tags,
                    reminder: habit.reminder,
                    createdAt: habit.createdAt,
                });
            }
        if (templates.length < 100) break;
    }
    return result.sort(compare);
}
export async function listHabits(
    context: TasksContext,
    query: ActivityQuery,
    today: string,
): Promise<Paginated<HabitOccurrence>> {
    const from = query.from ?? today,
        to = query.to ?? addDays(from, 30);
    return activityPage(await habitRange(context, from, to), query);
}
