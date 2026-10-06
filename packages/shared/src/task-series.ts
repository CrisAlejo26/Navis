import { addDays } from './dates';
import type { TaskRepeatPause, TaskSeriesActionInput } from './schemas/task-series';

/** A pause is inclusive; resuming today closes it yesterday. No historic rewrites. */
export function changeTaskSeries(
    previous: { repeatPauses?: TaskRepeatPause[] | null; repeatStoppedAt?: string | null },
    command: TaskSeriesActionInput,
): { repeatPauses: TaskRepeatPause[]; repeatStoppedAt: string | null } {
    const repeatPauses = (previous.repeatPauses ?? []).map((pause) => ({ ...pause }));
    const repeatStoppedAt = previous.repeatStoppedAt ?? null;
    if (repeatStoppedAt) throw new Error('series-finished');
    const open = repeatPauses.find((pause) => pause.to === null);
    const last = repeatPauses.at(-1);
    if (last && command.date < (last.to ?? last.from)) throw new Error('series-date');
    if (command.action === 'pause' && !open) repeatPauses.push({ from: command.date, to: null });
    if (command.action === 'resume' && open) {
        if (command.date === open.from) repeatPauses.splice(repeatPauses.indexOf(open), 1);
        else open.to = addDays(command.date, -1);
    }
    return { repeatPauses, repeatStoppedAt: command.action === 'finish' ? command.date : null };
}
