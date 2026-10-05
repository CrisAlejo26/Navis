import '@/data/test-support';
import { createTaskSchema, createHabitSchema } from '@navis/shared';
import { createTask, updateTask, findTask, deleteTask, taskRange } from './tasks-repo';
import { createHabit, updateHabit, findHabit, deleteHabit, habitRange } from './habits-repo';
import { createTaskTag, updateTaskTag, deleteTaskTag } from './tags-repo';
import { listActivities } from './activities-repo';
import { tasksFixture, taskInput } from './tasks-test-support';
import { defaultFilters } from '@/lib/tasks/filters';
jest.mock('expo-sqlite', () => ({ openDatabaseAsync: jest.fn() }));
describe('alta, edición y borrado desde el editor', () => {
    const { contexts: c } = tasksFixture();
    it('guarda estado, etiqueta y recordatorio juntos; la edición actualiza la agenda', async () => {
        const tag = await createTaskTag(c.north, {
            name: 'Visitas',
            icon: 'users',
            accent: 'primary',
        });
        const input = createTaskSchema.parse({
            ...taskInput,
            tagIds: [tag],
            reminderEnabled: true,
            reminderAt: '2026-10-05T15:00:00Z',
            reminderTagIds: [tag],
        });
        const task = await createTask(c.north, input, { date: input.date, status: 'en_progreso' });
        expect(await findTask(c.north, task)).toMatchObject({
            status: 'en_progreso',
            tags: [{ id: tag }],
            reminder: { tags: [{ id: tag }] },
        });
        await updateTask(
            c.north,
            task,
            {
                title: 'Visita confirmada',
                date: '2026-10-06',
                time: '17:00',
                reminderEnabled: false,
            },
            { date: '2026-10-06', status: 'completada' },
        );
        expect(
            await listActivities(
                c.north,
                { ...defaultFilters(), hideCompleted: false },
                input.date,
            ),
        ).toMatchObject({ items: [{ title: 'Visita confirmada', status: 'completada' }] });
        const completedAt = (await findTask(c.north, task))?.completedAt;
        await updateTask(
            c.north,
            task,
            { description: 'Contacto realizado' },
            { date: '2026-10-06', status: 'completada' },
        );
        expect((await findTask(c.north, task))?.completedAt).toBe(completedAt);
        await updateTaskTag(c.north, tag, {
            name: 'Acompañamiento',
            icon: 'heart-handshake',
            accent: '#0284c7',
        });
        expect((await findTask(c.north, task))?.tags[0].name).toBe('Acompañamiento');
        await deleteTaskTag(c.north, tag);
        expect((await findTask(c.north, task))?.tags).toEqual([]);
        await deleteTask(c.north, task);
        expect(await findTask(c.north, task)).toBeNull();
        expect((await listActivities(c.north, defaultFilters(), input.date)).items).toEqual([]);
    });
    it('guarda hábitos y su ocurrencia sin admitir en progreso', async () => {
        const input = createHabitSchema.parse({
            title: 'Lectura',
            date: taskInput.date,
            goal: 'Un capítulo',
            repeatFreq: 'diaria',
            reminderEnabled: false,
        });
        const habit = await createHabit(c.north, input, { date: input.date, status: 'completada' });
        await updateHabit(
            c.north,
            habit,
            { goal: 'Dos capítulos' },
            { date: '2026-10-06', status: 'pendiente' },
        );
        expect(await findHabit(c.north, habit)).toMatchObject({ goal: 'Dos capítulos' });
        expect(await habitRange(c.north, input.date, '2026-10-06')).toMatchObject([
            { status: 'completada' },
            { status: 'pendiente' },
        ]);
        await deleteHabit(c.north, habit);
        expect(await findHabit(c.north, habit)).toBeNull();
        await expect(
            createHabit(c.north, input, { date: input.date, status: 'en_progreso' }),
        ).rejects.toThrow();
    });
    it('revierte toda el alta o edición si la ocurrencia es inválida', async () => {
        await expect(
            createTask(c.north, taskInput, { date: '2026-10-06', status: 'completada' }),
        ).rejects.toThrow('invalid-occurrence');
        expect(await taskRange(c.north, taskInput.date, taskInput.date)).toEqual([]);
        const task = await createTask(c.north, taskInput);
        await expect(
            updateTask(
                c.north,
                task,
                { title: 'No debe persistir' },
                { date: '2026-10-06', status: 'completada' },
            ),
        ).rejects.toThrow('invalid-occurrence');
        expect((await findTask(c.north, task))?.title).toBe(taskInput.title);
        await expect(updateTask(c.member, task, { title: 'Ajena' })).rejects.toThrow('not-found');
    });
});
