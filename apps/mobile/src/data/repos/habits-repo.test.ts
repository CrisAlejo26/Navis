import '@/data/test-support';
import {
    createHabit,
    updateHabit,
    findHabit,
    deleteHabit,
    setHabitStatus,
    habitRange,
    listHabits,
} from './habits-repo';
import { createTaskTag, listTaskTags, updateTaskTag, deleteTaskTag } from './tags-repo';
import { habitInput, tasksFixture } from './tasks-test-support';
jest.mock('expo-sqlite', () => ({ openDatabaseAsync: jest.fn() }));

describe('hábitos y etiquetas locales', () => {
    const { contexts: c, db } = tasksFixture();
    it('tiene meta, dos estados, repetición e historial propios', async () => {
        const id = await createHabit(c.north, { ...habitInput, goal: '20 minutos' });
        await updateHabit(c.north, id, { title: 'Lectura diaria', goal: null });
        expect((await findHabit(c.north, id))?.goal).toBeNull();
        expect(await habitRange(c.north, '2026-10-05', '2026-10-06')).toHaveLength(2);
        await setHabitStatus(c.north, id, '2026-10-05', 'completada');
        await setHabitStatus(c.north, id, '2026-10-05', 'completada');
        expect(await (await db()).getAllAsync('SELECT id FROM habit_occurrences')).toHaveLength(1);
        expect(
            (await listHabits(c.north, { from: '2026-10-05', to: '2026-10-06' }, '2026-10-05'))
                .total,
        ).toBe(1);
        await deleteHabit(c.north, id);
        expect(await findHabit(c.north, id)).toBeNull();
        expect(await habitRange(c.north, '2026-10-05', '2026-10-06')).toMatchObject([
            { habitId: id, status: 'completada' },
        ]);
    });
    it('protege hábitos y sus recordatorios entre iglesias y propietarios', async () => {
        const id = await createHabit(c.north, habitInput);
        for (const other of [c.south, c.member]) {
            expect(await findHabit(other, id)).toBeNull();
            expect(await habitRange(other, habitInput.date, habitInput.date)).toEqual([]);
            await expect(updateHabit(other, id, { reminderEnabled: true })).rejects.toThrow(
                'not-found',
            );
            await expect(setHabitStatus(other, id, habitInput.date, 'completada')).rejects.toThrow(
                'not-found',
            );
            await expect(deleteHabit(other, id)).rejects.toThrow('not-found');
        }
    });
    it('valida icono y color, nombres únicos y referencias de etiquetas', async () => {
        const tagInput = { name: 'Lectura', icon: 'book-open', accent: 'primary' };
        const tag = await createTaskTag(c.north, tagInput);
        await expect(createTaskTag(c.north, tagInput)).rejects.toThrow();
        await expect(createTaskTag(c.north, { ...tagInput, icon: 'cross' })).rejects.toThrow();
        await expect(createHabit(c.south, { ...habitInput, tagIds: [tag] })).rejects.toThrow(
            'not-found',
        );
        await expect(updateTaskTag(c.member, tag, { name: 'Ajena' })).rejects.toThrow('not-found');
        await expect(deleteTaskTag(c.south, tag)).rejects.toThrow('not-found');
        const id = await createHabit(c.north, {
            ...habitInput,
            tagIds: [tag],
            reminderTagIds: [tag],
        });
        await updateTaskTag(c.north, tag, { name: 'Biblia', accent: '#123456' });
        expect((await findHabit(c.north, id))?.tags[0]).toMatchObject({
            name: 'Biblia',
            accent: '#123456',
        });
        await deleteTaskTag(c.north, tag);
        expect(await listTaskTags(c.north)).toEqual([]);
        expect((await findHabit(c.north, id))?.reminder?.tags).toEqual([]);
        expect((await findHabit(c.north, id))?.tags).toEqual([]);
    });
    it('completar una puntual cambia la plantilla sin crear ocurrencias', async () => {
        const id = await createHabit(c.north, { ...habitInput, repeatFreq: 'ninguna' });
        await setHabitStatus(c.north, id, habitInput.date, 'completada');
        expect((await findHabit(c.north, id))?.status).toBe('completada');
        expect(await (await db()).getAllAsync('SELECT id FROM habit_occurrences')).toEqual([]);
        await expect(setHabitStatus(c.north, id, '2026-10-06', 'completada')).rejects.toThrow(
            'invalid-occurrence',
        );
    });
});
