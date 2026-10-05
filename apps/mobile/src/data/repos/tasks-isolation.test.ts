import '@/data/test-support';
import {
    createTask,
    updateTask,
    findTask,
    deleteTask,
    setTaskStatus,
    taskRange,
} from './tasks-repo';
import { createTaskTag } from './tags-repo';
import { taskInput, tasksFixture } from './tasks-test-support';
jest.mock('expo-sqlite', () => ({ openDatabaseAsync: jest.fn() }));

describe('aislamiento de tareas personales', () => {
    const { contexts: c } = tasksFixture();
    it('crea, edita y conserva las etiquetas y el aviso al cambiar solo su título', async () => {
        const tag = await createTaskTag(c.north, {
            name: 'Visitas',
            icon: 'book-open',
            accent: 'primary',
        });
        const id = await createTask(c.north, {
            ...taskInput,
            tagIds: [tag],
            reminderTagIds: [tag],
            reminderAt: '2099-10-05T12:00:00Z',
        });
        const before = await findTask(c.north, id);
        await updateTask(c.north, id, { title: 'Título nuevo' });
        expect(await findTask(c.north, id)).toMatchObject({
            title: 'Título nuevo',
            tags: before?.tags,
            reminder: before?.reminder,
        });
        await updateTask(c.north, id, { reminderEnabled: true });
        expect((await findTask(c.north, id))?.reminder).toMatchObject({
            enabled: true,
            remindAt: '2099-10-05T12:00:00.000Z',
            tags: before?.reminder?.tags,
        });
    });
    it('aísla lecturas, estados, edición y borrado entre iglesias y usuarios', async () => {
        const id = await createTask(c.north, taskInput);
        for (const other of [c.south, c.member]) {
            expect(await findTask(other, id)).toBeNull();
            expect(await taskRange(other, taskInput.date, taskInput.date)).toEqual([]);
            await expect(updateTask(other, id, { title: 'Ajena' })).rejects.toThrow('not-found');
            await expect(deleteTask(other, id)).rejects.toThrow('not-found');
            await expect(setTaskStatus(other, id, taskInput.date, 'completada')).rejects.toThrow(
                'not-found',
            );
        }
        const own = await createTask(c.member, taskInput);
        expect(await findTask(c.north, own)).toBeNull();
        expect((await findTask(c.member, own))?.title).toBe(taskInput.title);
        await expect(createTask({ ...c.north, userId: 'outsider' }, taskInput)).rejects.toThrow(
            'not-found',
        );
    });
    it('rechaza referencias ajenas sin guardar parcialmente la tarea', async () => {
        const foreign = await createTaskTag(c.south, {
            name: 'Ajena',
            icon: 'book-open',
            accent: 'primary',
        });
        await expect(
            createTask(c.north, { ...taskInput, reminderTagIds: [foreign] }),
        ).rejects.toThrow('not-found');
        expect(await taskRange(c.north, taskInput.date, taskInput.date)).toEqual([]);
    });
});
