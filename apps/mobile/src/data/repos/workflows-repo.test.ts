import '@/data/test-support';
import { migrateWorkflows } from '../workflows-migration';
import { matchingActivities } from './activity-query';
import { createTask, findTask, taskRange, updateTask } from './tasks-repo';
import { taskInput, tasksFixture } from './tasks-test-support';
import { createWorkflow, deleteWorkflow, listWorkflows, updateWorkflow } from './workflows-repo';

jest.mock('expo-sqlite', () => ({ openDatabaseAsync: jest.fn() }));

const flow = (name: string, accent = '#2140cf') => ({ name, accent, description: null });

describe('flujos de trabajo con SQLite real (Fase 7b)', () => {
    const { contexts: c, db } = tasksFixture();

    it('se crean, se listan en orden con su recuento y se editan', async () => {
        const first = await createWorkflow(c.north, flow('Predicación'));
        const second = await createWorkflow(c.north, {
            ...flow('Visitas'),
            description: 'Del mes',
        });
        await createTask(c.north, { ...taskInput, workflowId: first });
        await createTask(c.north, { ...taskInput, workflowId: first });
        expect(await listWorkflows(c.north)).toEqual([
            expect.objectContaining({ id: first, name: 'Predicación', count: 2, position: 0 }),
            expect.objectContaining({
                id: second,
                name: 'Visitas',
                description: 'Del mes',
                count: 0,
                position: 1,
            }),
        ]);
        await updateWorkflow(c.north, second, { name: 'Visitas 2', description: null });
        expect((await listWorkflows(c.north))[1]).toMatchObject({
            name: 'Visitas 2',
            description: null,
        });
    });

    it('no admite dos con el mismo nombre en la misma cuenta e iglesia', async () => {
        await createWorkflow(c.north, flow('Repetido'));
        await expect(createWorkflow(c.north, flow('Repetido'))).rejects.toThrow();
        await expect(createWorkflow(c.south, flow('Repetido'))).resolves.toBeTruthy();
    });

    it('rechaza un nombre vacío y un color inválido', async () => {
        await expect(createWorkflow(c.north, flow(''))).rejects.toThrow();
        await expect(createWorkflow(c.north, flow('Mal', 'rojo'))).rejects.toThrow();
    });

    it('una tarea lleva su flujo en la plantilla y en el rango, y se le puede quitar', async () => {
        const id = await createWorkflow(c.north, flow('Visitas', '#00aa44'));
        const task = await createTask(c.north, { ...taskInput, workflowId: id });
        expect((await findTask(c.north, task))?.workflow).toEqual({
            id,
            name: 'Visitas',
            accent: '#00aa44',
        });
        const [row] = await taskRange(c.north, '2026-10-05', '2026-10-05');
        expect(row?.workflow?.id).toBe(id);
        await updateTask(c.north, task, { workflowId: null });
        expect((await findTask(c.north, task))?.workflow ?? null).toBeNull();
    });

    it('editar el texto de una tarea no le quita el flujo', async () => {
        const id = await createWorkflow(c.north, flow('Se queda'));
        const task = await createTask(c.north, { ...taskInput, workflowId: id });
        await updateTask(c.north, task, { title: 'Otro título' });
        expect((await findTask(c.north, task))?.workflow?.id).toBe(id);
    });

    it('filtra el listado por flujo', async () => {
        const id = await createWorkflow(c.north, flow('Filtro'));
        const inside = await createTask(c.north, { ...taskInput, workflowId: id });
        await createTask(c.north, taskInput);
        const rows = await taskRange(c.north, '2026-10-05', '2026-10-05');
        expect(matchingActivities(rows, { workflowId: id }).map((row) => row.taskId)).toEqual([
            inside,
        ]);
        expect(matchingActivities(rows, {})).toHaveLength(2);
    });

    it('borrar un flujo deja sus tareas sin flujo y no las borra', async () => {
        const id = await createWorkflow(c.north, flow('Efímero'));
        const task = await createTask(c.north, { ...taskInput, workflowId: id });
        await deleteWorkflow(c.north, id);
        expect(await listWorkflows(c.north)).toEqual([]);
        const after = await findTask(c.north, task);
        expect(after?.title).toBe(taskInput.title);
        expect(after?.workflow ?? null).toBeNull();
    });

    it('un flujo de otra iglesia o de otra persona no se puede usar ni tocar', async () => {
        const south = await createWorkflow(c.south, flow('Del sur'));
        await expect(createTask(c.north, { ...taskInput, workflowId: south })).rejects.toThrow(
            'not-found',
        );
        const mine = await createWorkflow(c.north, flow('Mío'));
        await expect(updateWorkflow(c.member, mine, { name: 'Robado' })).rejects.toThrow(
            'not-found',
        );
        await expect(deleteWorkflow(c.south, mine)).rejects.toThrow('not-found');
        expect(await listWorkflows(c.member)).toEqual([]);
        const task = await createTask(c.north, taskInput);
        await expect(updateTask(c.north, task, { workflowId: south })).rejects.toThrow('not-found');
    });

    it('migra una base anterior sin perder tareas y es idempotente', async () => {
        const connection = await db();
        const id = await createWorkflow(c.north, flow('Antes'));
        const task = await createTask(c.north, { ...taskInput, workflowId: id });
        await connection.execAsync('DROP TABLE workflows');
        await connection.execAsync('ALTER TABLE tasks DROP COLUMN workflow_id');
        await connection.withTransactionAsync(() => migrateWorkflows(connection));
        await connection.withTransactionAsync(() => migrateWorkflows(connection));
        expect((await findTask(c.north, task))?.title).toBe(taskInput.title);
        const created = await createWorkflow(c.north, flow('Después'));
        await updateTask(c.north, task, { workflowId: created });
        expect((await findTask(c.north, task))?.workflow?.name).toBe('Después');
    });
});
