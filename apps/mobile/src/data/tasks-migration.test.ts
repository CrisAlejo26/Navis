import '@/data/test-support';
import { ALL_LOCAL_TABLES, LOCAL_TASK_TABLES } from '@navis/shared';
import { migrateTasks } from './tasks-migration';
import { tasksFixture, taskInput } from './repos/tasks-test-support';
import { createTask, findTask } from './repos/tasks-repo';
jest.mock('expo-sqlite', () => ({ openDatabaseAsync: jest.fn() }));

describe('migración SQLite de tareas', () => {
    const { db, contexts: c } = tasksFixture();
    it('migra una base v15 conservando las tareas y es idempotente', async () => {
        const connection = await db(),
            id = await createTask(c.north, taskInput);
        for (const table of [...LOCAL_TASK_TABLES].reverse())
            await connection.execAsync(`DROP TABLE ${table.name}`);
        await connection.withTransactionAsync(() => migrateTasks(connection));
        await connection.withTransactionAsync(() => migrateTasks(connection));
        expect((await findTask(c.north, id))?.title).toBe(taskInput.title);
        for (const table of LOCAL_TASK_TABLES) {
            const columns = await connection.getAllAsync<{ name: string }>(
                `PRAGMA table_info(${table.name})`,
            );
            expect(columns.map((row) => row.name)).toEqual(
                table.columns.map((column) => column.name),
            );
        }
        expect(ALL_LOCAL_TABLES.map((table) => table.name)).toContain('task_streak_cache');
    });
});
