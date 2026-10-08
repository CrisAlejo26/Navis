import type { TaskStatus } from './schemas/tasks';

interface LimitFields {
    dueDate?: string | null;
    inProgressDeadline?: string | null;
    status: TaskStatus | null;
}

/**
 * «Vencida»: tiene fecha límite, ya pasó (el mismo día aún no) y no está
 * completada. `today` es el día de la iglesia, no el del servidor (D16).
 */
export function isTaskOverdue(
    task: Pick<LimitFields, 'dueDate' | 'status'>,
    today: string,
): boolean {
    return (
        Boolean(task.dueDate) && (task.dueDate as string) < today && task.status !== 'completada'
    );
}

/**
 * La alarma del tiempo máximo en curso: solo existe mientras la tarea sigue
 * «en progreso». Completarla o devolverla a pendiente la retira, y una hora
 * que ya pasó no se programa (no hay nada que avisar «a tiempo»).
 */
export function taskDeadlineAlarm(task: LimitFields, now: Date): Date | null {
    if (task.status !== 'en_progreso' || !task.inProgressDeadline) return null;
    const at = new Date(task.inProgressDeadline);
    return Number.isNaN(at.getTime()) || at.getTime() <= now.getTime() ? null : at;
}
