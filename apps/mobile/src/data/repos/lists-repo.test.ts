import { setupLocalDb } from '@/data/test-support';
import { getDb, setDbForTests, SCHEMA_VERSION } from '@/data/db';
import { openDatabaseAsync } from 'expo-sqlite';
import { createChurch } from './church-repo';
import { createBeliever } from './believers-repo';
import { createList, updateList, deleteList, readLists, readListMembers } from './lists-repo';
import {
    addListMembers,
    reorderListMembers,
    updateMemberNote,
    removeListMember,
} from './list-members-writes';
import { readListStats } from './list-stats';
import { migrateLists } from '../lists-migration';
import { saveListExportFields } from './list-export-settings';
import { listPublicFieldsSchema } from '@navis/shared';

jest.mock('expo-sqlite', () => ({ __esModule: true, openDatabaseAsync: jest.fn() }));
describe('listas independientes del teléfono', () => {
    let db: Awaited<ReturnType<typeof setupLocalDb>>;
    let context: { churchId: string; userId: string };
    let other: typeof context;
    beforeAll(async () => {
        db = await setupLocalDb({ setDbForTests, openDatabaseMock: openDatabaseAsync });
        context = {
            churchId: (await createChurch({ name: 'Sur', city: 'Elda', ownerId: 'owner' })).id,
            userId: 'owner',
        };
        other = {
            churchId: (await createChurch({ name: 'Norte', city: 'Madrid', ownerId: 'other' })).id,
            userId: 'other',
        };
    });
    afterAll(() => db.close());
    it('conserva el slug y el orden al renombrar y no comunica datos de otra iglesia', async () => {
        const id = await createList(context, { name: 'Sonido' });
        const slug = (await readLists(context))[0].slug;
        await updateList(context, id, { name: 'Sonido nuevo' });
        expect((await readLists(context))[0].slug).toBe(slug);
        expect(await readLists(other)).toEqual([]);
        await expect(updateList(other, id, { name: 'Ajena' })).rejects.toThrow('not-found');
        await expect(readListMembers(other, id)).rejects.toThrow('not-found');
        await expect(readLists({ ...context, userId: 'other' })).rejects.toThrow('not-found');
    });
    it('añade sin duplicados, rechaza referencias ajenas y revierte el lote entero', async () => {
        const id = await createList(context, { name: 'Recepción' });
        const believer = await createBeliever(context.churchId, { firstName: 'Ana' });
        const foreign = await createBeliever(other.churchId, { firstName: 'Eva' });
        await expect(addListMembers(context, id, [believer, foreign])).rejects.toThrow('not-found');
        expect(await readListMembers(context, id)).toEqual([]);
        await addListMembers(context, id, [believer, believer]);
        await addListMembers(context, id, [believer]);
        expect(await readListMembers(context, id)).toHaveLength(1);
        await expect(updateMemberNote(other, id, believer, 'ajena')).rejects.toThrow('not-found');
        await expect(removeListMember(context, id, foreign)).rejects.toThrow('not-found');
    });
    it('reordena el conjunto entero, conserva notas y al quitar no borra personas', async () => {
        const id = await createList(context, { name: 'Púlpito' });
        const ana = await createBeliever(context.churchId, { firstName: 'Ana' });
        const juan = await createBeliever(context.churchId, { firstName: 'Juan' });
        await addListMembers(context, id, [ana, juan]);
        await updateMemberNote(context, id, ana, ' Primer domingo ');
        await expect(reorderListMembers(context, id, [ana, ana])).rejects.toThrow('invalid-order');
        await expect(reorderListMembers(context, id, [juan])).rejects.toThrow('invalid-order');
        await reorderListMembers(context, id, [juan, ana]);
        const members = await readListMembers(context, id);
        expect(members.map((one) => one.believerId)).toEqual([juan, ana]);
        expect(members[1].note).toBe('Primer domingo');
        await removeListMember(context, id, ana);
        expect((await readListMembers(context, id)).map((one) => one.believerId)).toEqual([juan]);
        await deleteList(context, id);
        expect(
            await db.adapter.getFirstAsync(
                'SELECT id FROM believers WHERE id = ? AND deleted_at IS NULL',
                ana,
            ),
        ).toBeTruthy();
        await expect(readListMembers(context, id)).rejects.toThrow('not-found');
    });
    it('calcula solapamientos reales sin incluir listas ajenas ni personas borradas', async () => {
        const one = await createList(context, { name: 'Equipo uno' });
        const two = await createList(context, { name: 'Equipo dos' });
        const believer = await createBeliever(context.churchId, { firstName: 'Luis' });
        await addListMembers(context, one, [believer]);
        await addListMembers(context, two, [believer]);
        expect((await readListStats(context, one)).overlap).toEqual([
            { id: two, name: 'Equipo dos', count: 1 },
        ]);
        await db.adapter.runAsync(
            'UPDATE believers SET deleted_at = ? WHERE id = ?',
            new Date().toISOString(),
            believer,
        );
        expect((await readListStats(context, one)).overlap).toEqual([]);
    });
    it('permite lectura al miembro y reserva gestión y exportación al propietario', async () => {
        await db.adapter.runAsync(
            'INSERT INTO church_members (id, church_id, user_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
            'reader-membership',
            context.churchId,
            'reader',
            't',
            't',
        );
        const id = await createList(context, { name: 'Lectura' });
        const reader = { ...context, userId: 'reader' };
        expect((await readLists(reader)).some((one) => one.id === id)).toBe(true);
        await expect(createList(reader, { name: 'No autorizada' })).rejects.toThrow('not-found');
        await expect(deleteList(reader, id)).rejects.toThrow('not-found');
        await expect(
            saveListExportFields(reader, id, listPublicFieldsSchema.parse({})),
        ).rejects.toThrow('not-found');
    });
    it('migra una base anterior sin alterar datos y se puede reiniciar', async () => {
        const local = await getDb();
        const before = await local.getAllAsync('SELECT id, name FROM churches');
        const believersBefore = await local.getAllAsync('SELECT id, first_name FROM believers');
        db.memory.exec(
            'DROP TABLE list_grants; DROP TABLE list_members; DROP TABLE list_views; DROP TABLE list_access_log; DROP TABLE list_viewers; DROP TABLE lists; PRAGMA user_version = 11;',
        );
        setDbForTests(null);
        await getDb();
        expect(await local.getAllAsync('SELECT id, name FROM churches')).toEqual(before);
        expect(await local.getAllAsync('SELECT id, first_name FROM believers')).toEqual(
            believersBefore,
        );
        await local.withTransactionAsync(() => migrateLists(local));
        expect(await local.getFirstAsync('PRAGMA user_version')).toEqual({
            user_version: SCHEMA_VERSION,
        });
        setDbForTests(null);
        expect(await readLists(context)).toEqual([]);
    });
});
