import { addDays, daysBetween, parseIsoDate } from './dates';
import type { TaskRepeatOptions } from './schemas/task-series';

const weekdayIndex = (date: string) => (parseIsoDate(date).getUTCDay() + 6) % 7;
const monday = (date: string) => addDays(date, -weekdayIndex(date));

/** Zero-based rank of a matching date. Count real occurrences, skipping short months. */
export function advancedRepeatIndex(
    anchor: string,
    date: string,
    interval: number,
    options: TaskRepeatOptions,
): number | null {
    if (options.kind === 'dates') {
        const dates = [...options.dates].filter((day) => day >= anchor).sort();
        const index = dates.indexOf(date);
        return index < 0 ? null : index;
    }
    const current = parseIsoDate(date),
        start = parseIsoDate(anchor);
    if (options.kind === 'weekdays') {
        const week = daysBetween(monday(anchor), monday(date)) / 7;
        if (week % interval || !options.weekdays.includes(current.getUTCDay())) return null;
        const ordered = options.weekdays.map((day) => (day + 6) % 7).sort((a, b) => a - b);
        const beforeAnchor = ordered.filter((day) => day < weekdayIndex(anchor)).length;
        return (
            (week / interval) * ordered.length + ordered.indexOf(weekdayIndex(date)) - beforeAnchor
        );
    }
    const months =
        (current.getUTCFullYear() - start.getUTCFullYear()) * 12 +
        current.getUTCMonth() -
        start.getUTCMonth();
    if (months % interval) return null;
    let count = 0;
    for (let offset = 0; offset <= months; offset += interval) {
        const first = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + offset, 1));
        const last = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0));
        let day: number;
        if (options.kind === 'monthDay') day = options.day;
        else if (options.week === -1)
            day = last.getUTCDate() - ((last.getUTCDay() - options.weekday + 7) % 7);
        else day = 1 + ((options.weekday - first.getUTCDay() + 7) % 7) + (options.week - 1) * 7;
        if (day > last.getUTCDate() || (offset === 0 && day < start.getUTCDate())) continue;
        if (offset === months) return current.getUTCDate() === day ? count : null;
        count++;
    }
    return null;
}
