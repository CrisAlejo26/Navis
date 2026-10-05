import { setupLocalDb } from '@/data/test-support';
import { getDb, setDbForTests } from '../db';
import { openDatabaseAsync } from 'expo-sqlite';
import { createChurch } from './church-repo';
import type { TasksContext } from './tasks-context';
import { createTaskSchema, createHabitSchema } from '@navis/shared';

export const taskInput = createTaskSchema.parse({
    title: 'Preparar el sermón',
    date: '2026-10-05',
    reminderEnabled: false,
});
export const habitInput = createHabitSchema.parse({
    title: 'Lectura',
    date: '2026-10-05',
    repeatFreq: 'diaria',
    reminderEnabled: false,
});

export function tasksFixture() {
    let local: Awaited<ReturnType<typeof setupLocalDb>>;
    const contexts = {
        north: { churchId: '', userId: 'owner' },
        south: { churchId: '', userId: 'owner' },
        member: { churchId: '', userId: 'member' },
    } satisfies Record<string, TasksContext>;
    beforeAll(async () => {
        local = await setupLocalDb({ setDbForTests, openDatabaseMock: openDatabaseAsync });
    });
    afterAll(() => local.close());
    beforeEach(async () => {
        await local.clear();
        contexts.north.churchId = (
            await createChurch({ name: 'Norte', city: 'Elda', ownerId: 'owner' })
        ).id;
        contexts.south.churchId = (
            await createChurch({ name: 'Sur', city: 'Elda', ownerId: 'owner' })
        ).id;
        contexts.member.churchId = contexts.north.churchId;
        await (
            await getDb()
        ).runAsync(
            'INSERT INTO church_members (id, created_at, updated_at, church_id, user_id) VALUES (?, ?, ?, ?, ?)',
            'member-id',
            'now',
            'now',
            contexts.north.churchId,
            'member',
        );
    });
    return { contexts, clear: async () => local.clear(), db: getDb };
}
