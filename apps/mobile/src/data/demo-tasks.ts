import {
    ACCENT_PALETTE,
    addDays,
    todayIn,
    createTaskSchema,
    createHabitSchema,
} from '@navis/shared';
import { createTask, setTaskStatus } from './repos/tasks-repo';
import { createHabit, setHabitStatus } from './repos/habits-repo';
import { createTaskTag, listTaskTags } from './repos/tags-repo';
import { tasksDb } from './repos/tasks-context';
import { findChurch } from './repos/church-repo';
import { DEMO_TASKS } from './demo-tasks-content';

/** Solo se invoca para la cuenta demo o al pedir datos de prueba. */
export async function seedDemoTasks(churchId: string, userId: string): Promise<void> {
    const context = { churchId, userId },
        db = await tasksDb(context);
    const existing = await db.getFirstAsync(
        'SELECT id FROM tasks WHERE church_id = ? AND owner_id = ? LIMIT 1',
        churchId,
        userId,
    );
    if (existing) return;
    const today = todayIn((await findChurch(churchId))?.timezone ?? 'UTC');
    const tags = await listTaskTags(context);
    const labels = [
        ['Predicación', 'book-open'],
        ['Visitas', 'users'],
        ['Comunidad', 'heart-handshake'],
    ] as const;
    const ids: string[] = [];
    for (const [index, [name, icon]] of labels.entries())
        ids.push(
            tags.find((tag) => tag.name === name)?.id ??
                (await createTaskTag(context, { name, icon, accent: ACCENT_PALETTE[index] })),
        );
    for (const [index, [title, description, tag, time, offset, priority]] of DEMO_TASKS.entries()) {
        const date = addDays(today, offset);
        const id = await createTask(
            context,
            createTaskSchema.parse({
                title,
                description,
                date,
                time,
                priority,
                tagIds: [ids[tag]],
                reminderEnabled: index === 1,
            }),
        );
        if (index === 0) await setTaskStatus(context, id, date, 'en_progreso');
        if (index === 5) await setTaskStatus(context, id, date, 'completada');
    }
    const start = addDays(today, -7);
    for (const [index, title] of ['Lectura diaria', 'Un momento de oración'].entries()) {
        const id = await createHabit(
            context,
            createHabitSchema.parse({
                title,
                goal: 'Dedicar diez minutos',
                date: start,
                time: index ? '21:00' : '08:00',
                repeatFreq: 'diaria',
                tagIds: [ids[0]],
                reminderEnabled: false,
            }),
        );
        for (let offset = -7; offset < 0; offset++)
            await setHabitStatus(context, id, addDays(today, offset), 'completada');
    }
}
