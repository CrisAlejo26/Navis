import '@/data/test-support';
import { asV1Copy } from '@/lib/backup/test-copies';
import { buildBackup } from './create-backup';
import { restoreBackup } from './restore-backup';
import type { BackupFiles } from './backup-format';
import {
    createTask,
    findTask,
    setTaskStatus,
    taskRange,
    taskStreak,
} from '@/data/repos/tasks-repo';
import { createHabit, findHabit, setHabitStatus } from '@/data/repos/habits-repo';
import { createTaskTag, listTaskTags } from '@/data/repos/tags-repo';
import { tasksFixture, taskInput, habitInput } from '@/data/repos/tasks-test-support';
jest.mock('expo-sqlite', () => ({ openDatabaseAsync: jest.fn() }));

const files: BackupFiles = {
    audioUri: (id) => id,
    photoUri: (id) => id,
    readAudio: () => Promise.resolve(null),
    readPhoto: () => Promise.resolve(null),
    writeAudio: async () => {},
    writePhoto: async () => {},
};
describe('backup completo de tareas y hábitos', () => {
    const { contexts: c, clear } = tasksFixture();
    it('restaura plantillas, etiquetas, ocurrencias, avisos y máximo de racha', async () => {
        const tag = await createTaskTag(c.north, {
            name: 'Lectura',
            icon: 'book-open',
            accent: 'primary',
        });
        const task = await createTask(c.north, {
            ...taskInput,
            isRecurring: true,
            repeatFreq: 'diaria',
            tagIds: [tag],
            reminderTagIds: [tag],
            reminderEnabled: true,
        });
        const habit = await createHabit(c.north, {
            ...habitInput,
            goal: '20 min',
            tagIds: [tag],
            reminderTagIds: [tag],
        });
        await setTaskStatus(c.north, task, taskInput.date, 'completada');
        await setHabitStatus(c.north, habit, taskInput.date, 'completada');
        await taskStreak(c.north, taskInput.date);
        const beforeTask = await findTask(c.north, task),
            beforeHabit = await findHabit(c.north, habit);
        const backup = await buildBackup(files);
        expect(backup.tables.task_reminder_tags).toHaveLength(1);
        expect(backup.tables.habit_reminder_tags).toHaveLength(1);
        await clear();
        await restoreBackup(JSON.stringify(backup), files);
        expect(await findTask(c.north, task)).toEqual(beforeTask);
        expect(await findHabit(c.north, habit)).toEqual(beforeHabit);
        expect(await listTaskTags(c.north)).toHaveLength(1);
        expect((await taskRange(c.north, taskInput.date, taskInput.date))[0].status).toBe(
            'completada',
        );
        expect(await taskStreak(c.north, taskInput.date)).toEqual({ current: 1, longest: 1 });
    });
    it('acepta las copias v15 que todavía no contienen las tablas nuevas', async () => {
        const backup = await buildBackup(files);
        for (const name of [
            'habits',
            'habit_tags',
            'habit_occurrences',
            'task_reminders',
            'task_reminder_tags',
            'habit_reminders',
            'habit_reminder_tags',
            'task_streak_cache',
        ])
            delete backup.tables[name];
        await restoreBackup(JSON.stringify(asV1Copy({ ...backup, schemaVersion: 15 })), files);
        expect(await listTaskTags(c.north)).toEqual([]);
    });
});
