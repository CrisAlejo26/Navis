import { todayIn } from './dates';
import type { TaskTimeEntry, TaskTimeSummary } from './schemas/task-time';
import type { WorkflowRef } from './schemas/workflows';

/**
 * Segundos de una entrada. Una entrada abierta cuenta hasta `now` (es lo que
 * enseña el cronómetro); una cerrada, hasta su `endedAt`. Nunca negativo: un
 * reloj del teléfono que retrocede no puede restar tiempo.
 */
export function entrySeconds(
    entry: Pick<TaskTimeEntry, 'startedAt' | 'endedAt'>,
    now: Date,
): number {
    const start = new Date(entry.startedAt).getTime();
    const end = entry.endedAt ? new Date(entry.endedAt).getTime() : now.getTime();
    if (Number.isNaN(start) || Number.isNaN(end)) return 0;
    return Math.max(0, Math.floor((end - start) / 1000));
}

/** El total de las entradas **cerradas**: la abierta aún no es tiempo trabajado. */
export function closedSeconds(
    entries: readonly Pick<TaskTimeEntry, 'startedAt' | 'endedAt'>[],
): number {
    return entries.reduce(
        (total, entry) => (entry.endedAt ? total + entrySeconds(entry, new Date()) : total),
        0,
    );
}

/** `12:03` o `1:05:12`: el reloj del cronómetro, igual en los seis idiomas. */
export function formatClock(totalSeconds: number): string {
    const seconds = Math.max(0, Math.floor(totalSeconds));
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    const pad = (value: number) => String(value).padStart(2, '0');
    return h > 0 ? `${String(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

/** `2h 15m`, `45m` o `30s`: para totales, donde los segundos sobran. */
export function formatDurationShort(totalSeconds: number): string {
    const seconds = Math.max(0, Math.floor(totalSeconds));
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return m > 0 ? `${String(h)}h ${String(m)}m` : `${String(h)}h`;
    if (m > 0) return `${String(m)}m`;
    return `${String(seconds)}s`;
}

interface SummaryTask {
    id: string;
    title: string;
    workflow?: WorkflowRef | null;
}

/**
 * El tiempo del rango por tarea y por flujo. Misma función en la API y en el
 * móvil, para que las cifras coincidan. Reglas:
 *
 * - Solo entradas **cerradas**.
 * - Una entrada pertenece al día en que **empezó**, en la zona de la iglesia
 *   (D16); no se parte a medianoche.
 * - Una tarea sin flujo suma en `workflowId: null`.
 */
export function summarizeTime(input: {
    entries: readonly TaskTimeEntry[];
    tasks: readonly SummaryTask[];
    from: string;
    to: string;
    timezone: string;
}): TaskTimeSummary {
    const tasks = new Map(input.tasks.map((task) => [task.id, task]));
    const perTask = new Map<string, number>();
    const perWorkflow = new Map<string, { ref: WorkflowRef | null; seconds: number }>();
    let totalSeconds = 0;

    for (const entry of input.entries) {
        if (!entry.endedAt) continue;
        const day = todayIn(input.timezone, new Date(entry.startedAt));
        if (day < input.from || day > input.to) continue;
        const task = tasks.get(entry.taskId);
        if (!task) continue;
        const seconds = entrySeconds(entry, new Date());
        totalSeconds += seconds;
        perTask.set(task.id, (perTask.get(task.id) ?? 0) + seconds);
        const key = task.workflow?.id ?? '';
        const current = perWorkflow.get(key) ?? { ref: task.workflow ?? null, seconds: 0 };
        perWorkflow.set(key, { ref: current.ref, seconds: current.seconds + seconds });
    }

    return {
        from: input.from,
        to: input.to,
        totalSeconds,
        byTask: [...perTask]
            .map(([taskId, seconds]) => ({
                taskId,
                title: tasks.get(taskId)?.title ?? '',
                seconds,
            }))
            .sort((a, b) => b.seconds - a.seconds || a.title.localeCompare(b.title)),
        byWorkflow: [...perWorkflow.values()]
            .map(({ ref, seconds }) => ({
                workflowId: ref?.id ?? null,
                name: ref?.name ?? null,
                accent: ref?.accent ?? null,
                seconds,
            }))
            .sort((a, b) => b.seconds - a.seconds || (a.name ?? '').localeCompare(b.name ?? '')),
    };
}
