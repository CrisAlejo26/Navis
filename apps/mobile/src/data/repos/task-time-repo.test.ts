import '@/data/test-support';
import { migrateTaskTime } from '../task-time-migration';
import {
    deleteTimeEntry,
    runningTimer,
    startTimer,
    stopTimer,
    taskTime,
    timeSummary,
} from './task-time-repo';
import { createTask, deleteTask } from './tasks-repo';
import { taskInput, tasksFixture } from './tasks-test-support';
import { createWorkflow } from './workflows-repo';

jest.mock('expo-sqlite', () => ({ openDatabaseAsync: jest.fn() }));

const at = (value: string) => new Date(value);

describe('cronómetro de tareas con SQLite real (Fase 7c)', () => {
    const { contexts: c, db } = tasksFixture();

    it('sin cronómetro en marcha no hay nada que parar', async () => {
        expect(await runningTimer(c.north)).toBeNull();
        await expect(stopTimer(c.north)).rejects.toThrow('not-found');
    });

    it('empieza, se ve en marcha y al parar queda cerrado con su duración', async () => {
        const task = await createTask(c.north, taskInput);
        const started = await startTimer(c.north, task, at('2026-10-08T09:00:00Z'));
        expect(started.task).toEqual({ id: task, title: taskInput.title });
        expect((await runningTimer(c.north))?.entry.id).toBe(started.entry.id);
        const stopped = await stopTimer(c.north, at('2026-10-08T09:30:00Z'));
        expect(stopped).toMatchObject({
            id: started.entry.id,
            endedAt: '2026-10-08T09:30:00.000Z',
        });
        expect(await runningTimer(c.north)).toBeNull();
        expect((await taskTime(c.north, task)).totalSeconds).toBe(1800);
    });

    it('empezar la misma tarea dos veces no parte la entrada', async () => {
        const task = await createTask(c.north, taskInput);
        const first = await startTimer(c.north, task, at('2026-10-08T09:00:00Z'));
        const second = await startTimer(c.north, task, at('2026-10-08T09:00:05Z'));
        expect(second.entry.id).toBe(first.entry.id);
        expect((await taskTime(c.north, task)).entries).toHaveLength(1);
    });

    it('empezar otra tarea detiene la anterior: solo hay un cronómetro en marcha', async () => {
        const one = await createTask(c.north, taskInput);
        const two = await createTask(c.north, { ...taskInput, title: 'Dos' });
        await startTimer(c.north, one, at('2026-10-08T09:00:00Z'));
        await startTimer(c.north, two, at('2026-10-08T09:10:00Z'));
        expect((await runningTimer(c.north))?.task.id).toBe(two);
        const closed = (await taskTime(c.north, one)).entries[0];
        expect(closed?.endedAt).toBe('2026-10-08T09:10:00.000Z');
    });

    it('un reloj que retrocede no deja una entrada que termina antes de empezar', async () => {
        const task = await createTask(c.north, taskInput);
        await startTimer(c.north, task, at('2026-10-08T09:00:00Z'));
        const stopped = await stopTimer(c.north, at('2026-10-08T08:00:00Z'));
        expect(stopped.endedAt).toBe(stopped.startedAt);
    });

    it('no se puede cronometrar una tarea ajena, de otra iglesia o borrada', async () => {
        const south = await createTask(c.south, taskInput);
        await expect(startTimer(c.north, south)).rejects.toThrow('not-found');
        const mine = await createTask(c.north, taskInput);
        await expect(startTimer(c.member, mine)).rejects.toThrow('not-found');
        await deleteTask(c.north, mine);
        await expect(startTimer(c.north, mine)).rejects.toThrow('not-found');
    });

    it('el cronómetro de una persona o iglesia no se ve en otra', async () => {
        const task = await createTask(c.north, taskInput);
        await startTimer(c.north, task);
        expect(await runningTimer(c.south)).toBeNull();
        expect(await runningTimer(c.member)).toBeNull();
        await expect(taskTime(c.member, task)).rejects.toThrow('not-found');
    });

    it('borrar una entrada la quita, y borrar la tarea conserva su tiempo', async () => {
        const task = await createTask(c.north, taskInput);
        const entry = (await startTimer(c.north, task, at('2026-10-06T08:00:00Z'))).entry;
        await stopTimer(c.north, at('2026-10-06T08:20:00Z'));
        await deleteTask(c.north, task);
        const kept = await timeSummary(c.north, '2026-10-06', '2026-10-06', 'UTC');
        expect(kept.byTask).toEqual([{ taskId: task, title: taskInput.title, seconds: 1200 }]);
        await deleteTimeEntry(c.north, entry.id);
        expect((await timeSummary(c.north, '2026-10-06', '2026-10-06', 'UTC')).totalSeconds).toBe(
            0,
        );
        await expect(deleteTimeEntry(c.north, entry.id)).rejects.toThrow('not-found');
    });

    it('el resumen suma por tarea y por flujo, con el día en la zona de la iglesia', async () => {
        const flow = await createWorkflow(c.north, { name: 'Visitas', accent: '#2140cf' });
        const inFlow = await createTask(c.north, { ...taskInput, workflowId: flow });
        const loose = await createTask(c.north, { ...taskInput, title: 'Suelta' });
        await startTimer(c.north, inFlow, at('2026-10-06T09:00:00Z'));
        await stopTimer(c.north, at('2026-10-06T10:00:00Z'));
        await startTimer(c.north, loose, at('2026-10-06T11:00:00Z'));
        await stopTimer(c.north, at('2026-10-06T11:10:00Z'));
        const summary = await timeSummary(c.north, '2026-10-05', '2026-10-11', 'UTC');
        expect(summary.totalSeconds).toBe(4200);
        expect(summary.byWorkflow).toEqual([
            { workflowId: flow, name: 'Visitas', accent: '#2140cf', seconds: 3600 },
            { workflowId: null, name: null, accent: null, seconds: 600 },
        ]);
        // 23:30 del domingo en Bogotá ya es lunes en UTC: otro día, otro rango.
        await startTimer(c.north, loose, at('2026-10-12T04:30:00Z'));
        await stopTimer(c.north, at('2026-10-12T05:00:00Z'));
        const bogota = await timeSummary(c.north, '2026-10-05', '2026-10-11', 'America/Bogota');
        const utc = await timeSummary(c.north, '2026-10-05', '2026-10-11', 'UTC');
        expect(bogota.totalSeconds - utc.totalSeconds).toBe(1800);
    });

    it('el cronómetro en marcha no cuenta en el resumen', async () => {
        const task = await createTask(c.north, taskInput);
        await startTimer(c.north, task, at('2026-10-06T09:00:00Z'));
        expect((await timeSummary(c.north, '2026-10-06', '2026-10-06', 'UTC')).totalSeconds).toBe(
            0,
        );
    });

    it('migra una base anterior sin perder tareas y es idempotente', async () => {
        const connection = await db();
        const task = await createTask(c.north, taskInput);
        await connection.execAsync('DROP TABLE task_time_entries');
        await connection.withTransactionAsync(() => migrateTaskTime(connection));
        await connection.withTransactionAsync(() => migrateTaskTime(connection));
        await startTimer(c.north, task, at('2026-10-06T09:00:00Z'));
        expect((await runningTimer(c.north))?.task.id).toBe(task);
    });
});
