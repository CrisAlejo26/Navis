import '@/data/test-support';
import { createTaskSchema } from '@navis/shared';
import { tasksFixture, taskInput } from './tasks-test-support';
import {
    createTask,
    findTask,
    taskRange,
    updateTask,
    setTaskStatus,
    listTasks,
} from './tasks-repo';
import { taskTemplates, actOnTaskSeries, orderTasks } from './task-series-repo';
import { migrateTaskSeries } from '../task-series-migration';
jest.mock('expo-sqlite', () => ({ openDatabaseAsync: jest.fn() }));
describe('series y orden con SQLite real', () => {
    const { contexts: c, db } = tasksFixture();
    const daily = () =>
        createTask(
            c.north,
            createTaskSchema.parse({ ...taskInput, isRecurring: true, repeatFreq: 'diaria' }),
        );
    it('migra v16 sin perder datos y admite repetición avanzada', async () => {
        const id = await createTask(c.north, taskInput),
            connection = await db();
        for (const column of [
            'repeat_options',
            'repeat_pauses',
            'repeat_stopped_at',
            'manual_order',
        ])
            await connection.execAsync(`ALTER TABLE tasks DROP COLUMN ${column}`);
        await connection.withTransactionAsync(() => migrateTaskSeries(connection));
        await connection.withTransactionAsync(() => migrateTaskSeries(connection));
        expect((await findTask(c.north, id))?.title).toBe(taskInput.title);
        await updateTask(c.north, id, {
            isRecurring: true,
            repeatFreq: 'semanal',
            repeatOptions: { kind: 'weekdays', weekdays: [1, 3] },
        });
        expect(
            (await taskRange(c.north, '2026-10-05', '2026-10-09')).map((row) => row.date),
        ).toEqual(['2026-10-05', '2026-10-07']);
    });
    it('pausa, reanuda y termina sin borrar histórico; permite reabrir materializadas', async () => {
        const id = await daily();
        await setTaskStatus(c.north, id, '2026-10-06', 'completada');
        await actOnTaskSeries(c.north, id, { action: 'pause', date: '2026-10-06' });
        expect(
            (await taskRange(c.north, '2026-10-05', '2026-10-08')).map((row) => row.date),
        ).toEqual(['2026-10-05', '2026-10-06']);
        await expect(setTaskStatus(c.north, id, '2026-10-07', 'completada')).rejects.toThrow(
            'invalid-occurrence',
        );
        await setTaskStatus(c.north, id, '2026-10-06', 'pendiente');
        await actOnTaskSeries(c.north, id, { action: 'resume', date: '2026-10-08' });
        await actOnTaskSeries(c.north, id, { action: 'finish', date: '2026-10-09' });
        expect(
            (await taskRange(c.north, '2026-10-05', '2026-10-10')).map((row) => row.date),
        ).toEqual(['2026-10-05', '2026-10-06', '2026-10-08']);
        expect((await taskTemplates(c.north, true)).items[0].repeatStoppedAt).toBe('2026-10-09');
    });
    it('cambiar la regla no elimina ocurrencias tocadas', async () => {
        const id = await daily();
        await setTaskStatus(c.north, id, '2026-10-06', 'completada');
        await updateTask(c.north, id, {
            repeatFreq: 'fechas',
            repeatOptions: { kind: 'dates', dates: ['2026-10-08'] },
        });
        expect(
            (await taskRange(c.north, '2026-10-05', '2026-10-10')).map((row) => row.date),
        ).toEqual(['2026-10-06', '2026-10-08']);
    });
    it('orden atómico, estable tras editar, aislado por iglesia y usuario', async () => {
        const first = await createTask(c.north, taskInput),
            second = await createTask(c.north, { ...taskInput, title: 'Segundo' });
        const foreign = await createTask(c.south, taskInput);
        await orderTasks(c.north, { ids: [second, first] });
        await updateTask(c.north, second, { title: 'Sigue primero' });
        expect(
            (
                await listTasks(
                    c.north,
                    { from: taskInput.date, to: taskInput.date, sort: 'manual' },
                    taskInput.date,
                )
            ).items.map((row) => row.taskId),
        ).toEqual([second, first]);
        await expect(orderTasks(c.north, { ids: [first, foreign] })).rejects.toThrow('not-found');
        await expect(orderTasks(c.member, { ids: [first] })).rejects.toThrow('not-found');
        expect((await findTask(c.north, second))?.manualOrder).toBe(0);
        await expect(
            actOnTaskSeries(c.south, first, { action: 'pause', date: taskInput.date }),
        ).rejects.toThrow('not-found');
    });
});
