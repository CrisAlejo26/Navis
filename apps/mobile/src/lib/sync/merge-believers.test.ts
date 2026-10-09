import { setupLocalDb } from '@/data/test-support';
import { openDatabaseAsync } from 'expo-sqlite';

import { getDb, setDbForTests } from '@/data/db';

import { canonicalBeliever } from './aliases';
import { setCaptureDestination } from './capture';
import { runSync } from './engine';
import { FakeSyncServer } from './fake-sync-server';
import { mergeBelievers } from './merge-believers';
import { insertSample } from './test-rows';
import { readLocalWireRow } from './wire-row';

jest.mock('expo-sqlite', () => ({ openDatabaseAsync: jest.fn() }));

const DEST = 'https://navis.test/api/v1|cuenta-1';
const NOW = '2026-10-09T10:00:00.000Z';

let fixture: Awaited<ReturnType<typeof setupLocalDb>>;
beforeAll(async () => {
    fixture = await setupLocalDb({ setDbForTests, openDatabaseMock: openDatabaseAsync });
});
beforeEach(() => fixture.clear());
afterAll(() => fixture.close());

async function count(sql: string, ...params: string[]): Promise<number> {
    const db = await getDb();
    const row = await db.getFirstAsync<{ total: number }>(sql, ...params);
    return row?.total ?? 0;
}

describe('fusión de creyentes duplicados', () => {
    it('lo que colgaba del retirado pasa al conservado y el retirado queda borrado con su alias', async () => {
        const keep = await insertSample('believers', { church_id: 'c1', first_name: 'Ana' });
        const drop = await insertSample('believers', {
            church_id: 'c1',
            first_name: 'Ana',
            phone: '600123456',
        });
        await insertSample('believer_notes', { believer_id: drop, church_id: 'c1' });
        await insertSample('believer_notes', { believer_id: keep, church_id: 'c1' });
        const db = await getDb();

        const report = await mergeBelievers(db, keep, drop, NOW);

        expect(report).toEqual({ moved: 1, collapsed: 0 });
        expect(
            await count('SELECT COUNT(*) AS total FROM believer_notes WHERE believer_id = ?', keep),
        ).toBe(2);
        expect(
            await count('SELECT COUNT(*) AS total FROM believer_notes WHERE believer_id = ?', drop),
        ).toBe(0);
        const dropped = await db.getFirstAsync<{ deleted_at: string | null }>(
            'SELECT deleted_at FROM believers WHERE id = ?',
            drop,
        );
        expect(dropped?.deleted_at).toBe(NOW);
        expect(await canonicalBeliever(db, drop)).toBe(keep);
    });

    it('trae los datos de contacto que le faltaban al conservado, sin pisar los que ya tenía', async () => {
        const keep = await insertSample('believers', { church_id: 'c1', email: 'ana@navis.org' });
        const drop = await insertSample('believers', {
            church_id: 'c1',
            phone: '600123456',
            email: 'otro@navis.org',
        });
        const db = await getDb();
        await mergeBelievers(db, keep, drop, NOW);
        const merged = await db.getFirstAsync<{ phone: string; email: string }>(
            'SELECT phone, email FROM believers WHERE id = ?',
            keep,
        );
        expect(merged).toEqual({ phone: '600123456', email: 'ana@navis.org' });
    });

    it('una pertenencia de lista (clave compuesta) se traslada, y si ya existía no se duplica', async () => {
        const keep = await insertSample('believers', { church_id: 'c1' });
        const drop = await insertSample('believers', { church_id: 'c1' });
        await insertSample('list_members', { list_id: 'l1', believer_id: drop });
        await insertSample('list_members', { list_id: 'l2', believer_id: drop });
        await insertSample('list_members', { list_id: 'l2', believer_id: keep });
        const db = await getDb();

        const report = await mergeBelievers(db, keep, drop, NOW);

        expect(report).toEqual({ moved: 1, collapsed: 1 });
        expect(
            await count('SELECT COUNT(*) AS total FROM list_members WHERE believer_id = ?', keep),
        ).toBe(2);
        expect(
            await count('SELECT COUNT(*) AS total FROM list_members WHERE believer_id = ?', drop),
        ).toBe(0);
    });

    it('una etiqueta que los dos tenían no se duplica', async () => {
        const keep = await insertSample('believers', { church_id: 'c1' });
        const drop = await insertSample('believers', { church_id: 'c1' });
        await insertSample('believer_tag_links', { believer_id: keep, tag_id: 't1' });
        await insertSample('believer_tag_links', { believer_id: drop, tag_id: 't1' });
        await insertSample('believer_tag_links', { believer_id: drop, tag_id: 't2' });
        const db = await getDb();
        await mergeBelievers(db, keep, drop, NOW);
        expect(
            await count(
                'SELECT COUNT(*) AS total FROM believer_tag_links WHERE believer_id = ? AND deleted_at IS NULL',
                keep,
            ),
        ).toBe(2);
    });

    it('se niega con creyentes de iglesias distintas, o consigo mismo', async () => {
        const a = await insertSample('believers', { church_id: 'c1' });
        const b = await insertSample('believers', { church_id: 'c2' });
        const db = await getDb();
        expect(await mergeBelievers(db, a, b, NOW)).toBe('invalid');
        expect(await mergeBelievers(db, a, a, NOW)).toBe('invalid');
        expect(await canonicalBeliever(db, b)).toBeNull();
    });

    it('lo que llegue del servidor con el id retirado se redirige y el retirado no resucita', async () => {
        const server = new FakeSyncServer();
        const db = await getDb();
        await setCaptureDestination(db, DEST);
        const keep = await insertSample('believers', { church_id: 'c1', first_name: 'Ana' });
        const drop = await insertSample('believers', { church_id: 'c1', first_name: 'Ana' });
        await runSync({ db, api: server, destination: DEST });
        await mergeBelievers(db, keep, drop, NOW);

        // Otro cliente aún cree que existe el retirado y le pone una nota.
        await setCaptureDestination(db, null);
        const noteId = await insertSample('believer_notes', { believer_id: drop, church_id: 'c1' });
        const wire = await readLocalWireRow(db, 'believer_notes', noteId);
        await db.runAsync('DELETE FROM believer_notes WHERE id = ?', noteId);
        await setCaptureDestination(db, DEST);
        server.remote('believer_notes', noteId, wire);
        // Y manda también una edición de la ficha retirada.
        const keepWire = await readLocalWireRow(db, 'believers', keep);
        server.remote('believers', drop, { ...keepWire, id: drop });

        await runSync({ db, api: server, destination: DEST });

        const note = await db.getFirstAsync<{ believer_id: string }>(
            'SELECT believer_id FROM believer_notes WHERE id = ?',
            noteId,
        );
        expect(note?.believer_id).toBe(keep); // redirigida
        const dropped = await db.getFirstAsync<{ deleted_at: string | null }>(
            'SELECT deleted_at FROM believers WHERE id = ?',
            drop,
        );
        expect(dropped?.deleted_at).not.toBeNull(); // no resucitó
    });
});
