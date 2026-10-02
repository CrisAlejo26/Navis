import { openDatabaseAsync } from 'expo-sqlite';
import { setupLocalDb } from './test-support';
import { setDbForTests } from './db';
import { seedDemoLists } from './demo-lists';
import { initializeTestUser } from './demo-data';
import { createChurch } from './repos/church-repo';
import { createAccount } from './repos/account-repo';
import { createBeliever } from './repos/believers-repo';
import { deleteList, readLists, readListMembers, updateList } from './repos/lists-repo';
import { readListStats } from './repos/list-stats';

jest.mock('expo-sqlite', () => ({ __esModule: true, openDatabaseAsync: jest.fn() }));
describe('listas de demostración', () => {
    let db: Awaited<ReturnType<typeof setupLocalDb>>;
    beforeAll(async () => {
        db = await setupLocalDb({ setDbForTests, openDatabaseMock: openDatabaseAsync });
    });
    beforeEach(async () => {
        await db.clear();
    });
    afterAll(() => db.close());
    async function setup(userId = 'owner') {
        const church = await createChurch({
            name: 'Iglesia Navis Demo',
            city: 'Elda',
            ownerId: userId,
        });
        for (const firstName of ['Miguel', 'Laura', 'Sofía'])
            await createBeliever(church.id, { firstName });
        return { churchId: church.id, userId };
    }
    it('siembra una vez, con vacío, archivo, notas y solapamientos reales', async () => {
        const context = await setup();
        await Promise.all([
            seedDemoLists(context.churchId, context.userId),
            seedDemoLists(context.churchId, context.userId),
        ]);
        await seedDemoLists(context.churchId, context.userId);
        const lists = await readLists(context, false);
        expect(lists).toHaveLength(7);
        expect(lists.filter((one) => one.isActive)).toHaveLength(6);
        const sound = lists.find((one) => one.slug === 'sonido')!;
        expect((await readListMembers(context, sound.id))[0].note).toContain('micrófonos');
        expect((await readListStats(context, sound.id)).overlap.map((one) => one.name)).toContain(
            'Púlpito',
        );
        expect(lists.find((one) => one.slug === 'retiro-de-jovenes')?.memberCount).toBe(0);
        expect(await db.adapter.getFirstAsync('SELECT COUNT(*) AS n FROM believers')).toEqual({
            n: 3,
        });
        await updateList(context, sound.id, { name: 'Sonido adaptado' });
        await seedDemoLists(context.churchId, context.userId);
        expect((await readLists(context, false)).find((one) => one.id === sound.id)?.name).toBe(
            'Sonido adaptado',
        );
        await deleteList(context, sound.id);
        await seedDemoLists(context.churchId, context.userId);
        expect((await readLists(context, false)).some((one) => one.slug === 'sonido')).toBe(false);
    });
    it('no siembra para un lector ni en otra iglesia', async () => {
        const context = await setup();
        const other = await setup('other');
        await seedDemoLists(context.churchId, 'other');
        expect(await readLists(context, false)).toEqual([]);
        await seedDemoLists(context.churchId, context.userId);
        expect(await readLists(other, false)).toEqual([]);
    });
    it('completa las listas al arrancar una demo ya existente', async () => {
        const account = await createAccount({
            name: 'Demo',
            email: 'demo@navis.app',
            password: 'navis-demo-1234',
        });
        if ('error' in account) throw new Error('demo-account');
        const context = await setup(account.user.id);
        await initializeTestUser();
        expect(await readLists(context, false)).toHaveLength(7);
    });
});
