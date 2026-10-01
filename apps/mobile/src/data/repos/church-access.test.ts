import { setupLocalDb } from '@/data/test-support';
import { getDb, setDbForTests } from '@/data/db';
import { createAccount } from './account-repo';
import { createChurch } from './church-repo';
import {
    listMyChurches,
    setActiveChurch,
    resolveActiveChurch,
    repairChurchAccess,
} from './church-access';
import { migrateChurchAccess } from '../church-access-migration';
import { openDatabaseAsync } from 'expo-sqlite';

jest.mock('expo-sqlite', () => ({ __esModule: true, openDatabaseAsync: jest.fn() }));
describe('acceso y activa persistente', () => {
    let fixture: Awaited<ReturnType<typeof setupLocalDb>>;
    beforeAll(async () => {
        fixture = await setupLocalDb({ setDbForTests, openDatabaseMock: openDatabaseAsync });
    });
    beforeEach(async () => {
        await fixture.clear();
    });
    afterAll(() => {
        fixture.close();
    });
    async function seed() {
        const result = await createAccount({
            name: 'Dueño',
            email: 'access@navis.app',
            password: 'MuySegura123',
        });
        if ('error' in result) throw new Error(result.error);
        const north = await createChurch({ name: 'Norte', city: '', ownerId: result.user.id });
        const south = await createChurch({
            name: 'Sur',
            city: '',
            country: 'CO',
            ownerId: result.user.id,
        });
        return { userId: result.user.id, north, south };
    }
    it('crea membresías, acepta país y persiste la selección', async () => {
        const { userId, north, south } = await seed();
        expect((await listMyChurches(userId)).map((c) => c.id)).toEqual(
            expect.arrayContaining([north.id, south.id]),
        );
        await fixture.adapter.runAsync(
            'UPDATE church_members SET user_id = ? WHERE church_id = ?',
            'guest',
            north.id,
        );
        await fixture.adapter.runAsync(
            'UPDATE church_members SET user_id = ? WHERE church_id = ?',
            userId,
            north.id,
        );
        expect(south.country).toBe('CO');
        expect((await resolveActiveChurch(userId))?.id).toBe(south.id);
        await setActiveChurch(userId, north.id);
        expect((await resolveActiveChurch(userId))?.id).toBe(north.id);
        await expect(setActiveChurch(userId, 'ajena')).rejects.toThrow('not-found');
        expect((await resolveActiveChurch(userId))?.id).toBe(north.id);
    });
    // Una iglesia eliminada o una membresía revocada nunca deja un contexto vacío.
    it('corrige acceso revocado, iglesia borrada y ninguna disponible', async () => {
        const { userId, north, south } = await seed();
        const db = await getDb();
        await db.runAsync(
            'UPDATE church_members SET deleted_at = ? WHERE church_id = ?',
            '2026-10-01',
            south.id,
        );
        await repairChurchAccess(db);
        expect((await resolveActiveChurch(userId))?.id).toBe(north.id);
        await db.runAsync(
            'UPDATE churches SET deleted_at = ? WHERE id = ?',
            '2026-10-01',
            north.id,
        );
        expect(await resolveActiveChurch(userId)).toBeNull();
        expect(
            await db.getFirstAsync('SELECT active_church_id FROM local_user WHERE id = ?', userId),
        ).toEqual({ active_church_id: null });
    });
    it('migra datos previos y repara membresías sin perder la activa', async () => {
        const { userId, north, south } = await seed();
        const db = await getDb();
        await db.execAsync(
            'DROP TABLE church_members; ALTER TABLE local_user DROP COLUMN active_church_id',
        );
        await migrateChurchAccess(db);
        expect(await listMyChurches(userId)).toHaveLength(2);
        expect(await resolveActiveChurch(userId)).not.toBeNull();
        await setActiveChurch(userId, south.id);
        await migrateChurchAccess(db);
        expect(await listMyChurches(userId)).toHaveLength(2);
        expect((await resolveActiveChurch(userId))?.id).toBe(south.id);
        expect((await listMyChurches(userId)).some((c) => c.id === north.id)).toBe(true);
    });
});
