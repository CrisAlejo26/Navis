import '@/data/test-support';
import { createTask, deleteTask, setTaskStatus } from './tasks-repo';
import { createHabit } from './habits-repo';
import { habitInput, taskInput, tasksFixture } from './tasks-test-support';
import { isOwnActivity, listPendingActivityReminders } from './activity-reminders-repo';

jest.mock('expo-sqlite', () => ({ openDatabaseAsync: jest.fn() }));

const AT = '2099-01-10T17:30:00.000Z';
const withReminder = { reminderEnabled: true, reminderAt: AT };

describe('recordatorios pendientes de tareas y hábitos con SQLite real', () => {
    const { contexts: c } = tasksFixture();

    it('lista el de una tarea y el de un hábito con su iglesia', async () => {
        const task = await createTask(c.north, { ...taskInput, ...withReminder });
        const habit = await createHabit(c.north, { ...habitInput, ...withReminder });
        const found = await listPendingActivityReminders('owner');
        expect(found.map((row) => [row.kind, row.id]).sort()).toEqual(
            [
                ['habit', habit],
                ['task', task],
            ].sort(),
        );
        expect(found[0]).toMatchObject({ churchId: c.north.churchId, churchName: 'Norte' });
        expect(found.find((row) => row.id === task)?.remindAt).toBe(AT);
    });

    it('no lista los desactivados ni los de actividades borradas', async () => {
        await createTask(c.north, { ...taskInput, reminderEnabled: false });
        const gone = await createTask(c.north, { ...taskInput, ...withReminder });
        await deleteTask(c.north, gone);
        expect(await listPendingActivityReminders('owner')).toEqual([]);
    });

    it('una tarea hecha deja de avisar, pero una serie sigue viva', async () => {
        const once = await createTask(c.north, { ...taskInput, ...withReminder });
        await setTaskStatus(c.north, once, taskInput.date, 'completada');
        const series = await createTask(c.north, {
            ...taskInput,
            ...withReminder,
            isRecurring: true,
            repeatFreq: 'diaria',
        });
        await setTaskStatus(c.north, series, taskInput.date, 'completada');
        expect((await listPendingActivityReminders('owner')).map((row) => row.id)).toEqual([
            series,
        ]);
    });

    it('cada persona ve solo los suyos y solo de iglesias donde sigue siendo miembro', async () => {
        await createTask(c.north, { ...taskInput, ...withReminder });
        await createTask(c.south, { ...taskInput, ...withReminder });
        expect(await listPendingActivityReminders('member')).toEqual([]);
        expect(await listPendingActivityReminders('owner')).toHaveLength(2);
    });

    it('isOwnActivity distingue dueño, iglesia, tipo y borrado', async () => {
        const task = await createTask(c.north, taskInput);
        expect(await isOwnActivity('owner', c.north.churchId, 'task', task)).toBe(true);
        expect(await isOwnActivity('member', c.north.churchId, 'task', task)).toBe(false);
        expect(await isOwnActivity('owner', c.south.churchId, 'task', task)).toBe(false);
        expect(await isOwnActivity('owner', c.north.churchId, 'habit', task)).toBe(false);
        await deleteTask(c.north, task);
        expect(await isOwnActivity('owner', c.north.churchId, 'task', task)).toBe(false);
    });
});
