import '@/data/test-support';
import {
    createTask,
    findTask,
    deleteTask,
    setTaskStatus,
    taskRange,
    listTasks,
    taskStreak,
} from './tasks-repo';
import { taskInput, tasksFixture } from './tasks-test-support';
jest.mock('expo-sqlite', () => ({ openDatabaseAsync: jest.fn() }));

describe('tareas personales locales', () => {
    const { contexts: c, db } = tasksFixture();
    it('materializa solo al tocarla; idempotencia y borrado conservan historia', async () => {
        const id = await createTask(c.north, {
            ...taskInput,
            isRecurring: true,
            repeatFreq: 'diaria',
        });
        expect(await taskRange(c.north, '2026-10-05', '2026-10-06')).toHaveLength(2);
        expect(await (await db()).getAllAsync('SELECT id FROM task_occurrences')).toEqual([]);
        await setTaskStatus(c.north, id, '2026-10-05', 'completada');
        await setTaskStatus(c.north, id, '2026-10-05', 'completada');
        expect(await (await db()).getAllAsync('SELECT id FROM task_occurrences')).toHaveLength(1);
        expect((await taskRange(c.north, '2026-10-06', '2026-10-06'))[0].status).toBe('pendiente');
        await expect(setTaskStatus(c.north, id, '2026-10-04', 'completada')).rejects.toThrow(
            'invalid-occurrence',
        );
        await deleteTask(c.north, id);
        expect(await findTask(c.north, id)).toBeNull();
        expect(await taskRange(c.north, '2026-10-05', '2026-10-06')).toMatchObject([
            { taskId: id, status: 'completada' },
        ]);
    });
    it('pagina después de filtrar; búsqueda sin acentos y fin de repetición', async () => {
        await createTask(c.north, {
            ...taskInput,
            isRecurring: true,
            repeatFreq: 'diaria',
            repeatEndType: 'cantidad',
            repeatEndCount: 3,
        });
        const page = await listTasks(
            c.north,
            { from: '2026-10-05', to: '2026-10-10', search: 'sermon', limit: 2 },
            '2026-10-05',
        );
        expect(page).toMatchObject({ total: 3, totalPages: 2, page: 1 });
        expect(page.items).toHaveLength(2);
        expect(
            (
                await listTasks(
                    c.north,
                    { from: '2026-10-05', to: '2026-10-10', page: 2, limit: 2 },
                    '2026-10-05',
                )
            ).items,
        ).toHaveLength(1);
        await expect(taskRange(c.north, '2026-10-05', '2027-10-05')).rejects.toThrow(
            'invalid-range',
        );
    });
    it('guarda el máximo de racha aunque se reabra una ocurrencia', async () => {
        const id = await createTask(c.north, {
            ...taskInput,
            isRecurring: true,
            repeatFreq: 'diaria',
        });
        await setTaskStatus(c.north, id, taskInput.date, 'completada');
        expect(await taskStreak(c.north, taskInput.date)).toEqual({ current: 1, longest: 1 });
        await setTaskStatus(c.north, id, taskInput.date, 'pendiente');
        expect(await taskStreak(c.north, taskInput.date)).toEqual({ current: 0, longest: 1 });
        expect(await taskStreak(c.south, taskInput.date)).toEqual({ current: 0, longest: 0 });
    });
});
