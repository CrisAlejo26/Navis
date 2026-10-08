import '@/data/test-support';
import { migrateTaskLimits } from '../task-limits-migration';
import { listPendingTaskDeadlines } from './task-deadlines-repo';
import { createTask, findTask, setTaskStatus, taskRange, updateTask } from './tasks-repo';
import { taskInput, tasksFixture } from './tasks-test-support';

jest.mock('expo-sqlite', () => ({ openDatabaseAsync: jest.fn() }));

const DEADLINE = '2099-10-05T18:00:00.000Z';

describe('el límite de una tarea con SQLite real (Fase 7a)', () => {
    const { contexts: c, db } = tasksFixture();

    it('guarda «vence el» y el tiempo máximo, y los lee en la plantilla y en el rango', async () => {
        const id = await createTask(c.north, {
            ...taskInput,
            dueDate: '2026-10-09',
            inProgressDeadline: DEADLINE,
        });
        const task = await findTask(c.north, id);
        expect(task).toMatchObject({ dueDate: '2026-10-09', inProgressDeadline: DEADLINE });
        const [row] = await taskRange(c.north, '2026-10-05', '2026-10-05');
        expect(row).toMatchObject({ dueDate: '2026-10-09', inProgressDeadline: DEADLINE });
    });

    it('una tarea sin límite no lo lleva, y se quita con null al editar', async () => {
        const plain = await createTask(c.north, taskInput);
        expect((await findTask(c.north, plain))?.dueDate ?? null).toBeNull();
        const id = await createTask(c.north, { ...taskInput, dueDate: '2026-10-09' });
        await updateTask(c.north, id, { dueDate: null });
        expect((await findTask(c.north, id))?.dueDate ?? null).toBeNull();
    });

    it('rechaza un límite anterior al día de la tarea', async () => {
        await expect(
            createTask(c.north, { ...taskInput, dueDate: '2026-10-01' }),
        ).rejects.toThrow();
    });

    it('convertir una tarea con límite en serie lo borra, como la API', async () => {
        const id = await createTask(c.north, {
            ...taskInput,
            dueDate: '2026-10-09',
            inProgressDeadline: DEADLINE,
        });
        await updateTask(c.north, id, { isRecurring: true, repeatFreq: 'diaria' });
        const task = await findTask(c.north, id);
        expect(task?.dueDate ?? null).toBeNull();
        expect(task?.inProgressDeadline ?? null).toBeNull();
    });

    it('las tareas de otra persona o iglesia no se mezclan', async () => {
        await createTask(c.south, { ...taskInput, inProgressDeadline: DEADLINE });
        expect(await taskRange(c.north, '2026-10-05', '2026-10-05')).toEqual([]);
    });

    it('migra una base anterior sin perder tareas y es idempotente', async () => {
        const connection = await db();
        const id = await createTask(c.north, { ...taskInput, dueDate: '2026-10-09' });
        for (const column of ['due_date', 'in_progress_deadline'])
            await connection.execAsync(`ALTER TABLE tasks DROP COLUMN ${column}`);
        await connection.withTransactionAsync(() => migrateTaskLimits(connection));
        await connection.withTransactionAsync(() => migrateTaskLimits(connection));
        expect((await findTask(c.north, id))?.title).toBe(taskInput.title);
        await updateTask(c.north, id, { dueDate: '2026-10-12' });
        expect((await findTask(c.north, id))?.dueDate).toBe('2026-10-12');
    });
});

describe('tareas con alarma de límite pendientes', () => {
    const { contexts: c } = tasksFixture();

    it('solo las «en progreso» con tiempo máximo y no repetitivas', async () => {
        const running = await createTask(c.north, { ...taskInput, inProgressDeadline: DEADLINE });
        const waiting = await createTask(c.north, { ...taskInput, inProgressDeadline: DEADLINE });
        await createTask(c.north, taskInput);
        await setTaskStatus(c.north, running, taskInput.date, 'en_progreso');
        expect((await listPendingTaskDeadlines('owner')).map((row) => row.id)).toEqual([running]);
        await setTaskStatus(c.north, waiting, taskInput.date, 'en_progreso');
        await setTaskStatus(c.north, running, taskInput.date, 'completada');
        expect((await listPendingTaskDeadlines('owner')).map((row) => row.id)).toEqual([waiting]);
    });

    it('cada persona ve solo las suyas', async () => {
        const id = await createTask(c.north, { ...taskInput, inProgressDeadline: DEADLINE });
        await setTaskStatus(c.north, id, taskInput.date, 'en_progreso');
        expect(await listPendingTaskDeadlines('member')).toEqual([]);
    });
});
