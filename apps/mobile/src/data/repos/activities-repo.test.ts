import '@/data/test-support';
import { createTask, setTaskStatus, deleteTask, taskRange } from './tasks-repo';
import { createHabit, setHabitStatus, deleteHabit } from './habits-repo';
import { listActivities, calendarActivities, hasActivities } from './activities-repo';
import { taskInput, habitInput, tasksFixture } from './tasks-test-support';
import { defaultFilters } from '@/lib/tasks/filters';
import { seedDemoTasks } from '../demo-tasks';
jest.mock('expo-sqlite', () => ({ openDatabaseAsync: jest.fn() }));

describe('agenda combinada local', () => {
    const { contexts: c } = tasksFixture();
    it('ordena y pagina tareas y hábitos juntos, sin perder filas ni mezclar iglesias', async () => {
        await createTask(c.north, { ...taskInput, title: 'Zeta' });
        await createHabit(c.north, { ...habitInput, title: 'Alfa', repeatFreq: 'ninguna' });
        await createTask(c.south, taskInput);
        const q = { ...defaultFilters(), from: taskInput.date, to: taskInput.date, limit: 1 };
        expect(await listActivities(c.north, q, taskInput.date)).toMatchObject({
            total: 2,
            pending: 2,
            items: [{ title: 'Alfa' }],
        });
        expect(await listActivities(c.north, { ...q, page: 2 }, taskInput.date)).toMatchObject({
            items: [{ title: 'Zeta' }],
        });
        expect(
            await listActivities(c.north, { ...q, type: 'habit' }, taskInput.date),
        ).toMatchObject({ total: 1 });
        expect(await hasActivities(c.member)).toBe(false);
    });
    it('el calendario incluye completadas y no se trunca a la primera página', async () => {
        const task = await createTask(c.north, {
            ...taskInput,
            isRecurring: true,
            repeatFreq: 'diaria',
        });
        const habit = await createHabit(c.north, habitInput);
        await setTaskStatus(c.north, task, taskInput.date, 'completada');
        await setHabitStatus(c.north, habit, taskInput.date, 'completada');
        const q = { ...defaultFilters(), from: taskInput.date, to: '2026-12-05', limit: 1 };
        expect(await calendarActivities(c.north, q, taskInput.date)).toHaveLength(124);
        expect(
            await calendarActivities(c.north, { ...q, from: '2026-10-06' }, taskInput.date, {
                from: '2026-10-05',
                to: '2026-10-05',
            }),
        ).toHaveLength(0);
        expect(await listActivities(c.north, q, taskInput.date)).toMatchObject({
            total: 122,
            done: 2,
            pending: 122,
        });
        expect(
            await listActivities(c.north, { ...q, reminder: 'with' }, taskInput.date),
        ).toMatchObject({ total: 0 });
    });
    it('el borrado quita las actividades de la agenda y conserva su historia', async () => {
        const task = await createTask(c.north, taskInput);
        const habit = await createHabit(c.north, { ...habitInput, repeatFreq: 'ninguna' });
        await setTaskStatus(c.north, task, taskInput.date, 'completada');
        await deleteTask(c.north, task);
        await deleteHabit(c.north, habit);
        const q = {
            ...defaultFilters(),
            from: taskInput.date,
            to: taskInput.date,
            hideCompleted: false,
        };
        expect(await listActivities(c.north, q, taskInput.date)).toMatchObject({
            total: 0,
            done: 0,
        });
        expect(await calendarActivities(c.north, q, taskInput.date)).toEqual([]);
        expect(await hasActivities(c.north)).toBe(false);
        expect(await taskRange(c.north, taskInput.date, taskInput.date)).toMatchObject([
            { taskId: task, status: 'completada' },
        ]);
    });
    it('la demo es idempotente y solo se crea en el contexto solicitado', async () => {
        await seedDemoTasks(c.north.churchId, c.north.userId);
        await seedDemoTasks(c.north.churchId, c.north.userId);
        expect(await hasActivities(c.north)).toBe(true);
        expect(await hasActivities(c.south)).toBe(false);
        expect(
            await listActivities(c.north, { ...defaultFilters(), type: 'task' }, taskInput.date),
        ).toMatchObject({ total: 5 });
    });
});
