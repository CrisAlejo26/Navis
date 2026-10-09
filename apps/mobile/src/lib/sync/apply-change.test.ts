import { setupLocalDb } from '@/data/test-support';
import { entityKeyColumns, joinEntityId, syncedTables, type LocalRow } from '@navis/shared';
import { openDatabaseAsync } from 'expo-sqlite';

import { getDb, setDbForTests } from '@/data/db';

import { applyChange } from './apply-change';
import { setCaptureDestination } from './capture';
import { rememberRevision } from './outbox';
import { insertSample } from './test-rows';
import { keyWhere, readLocalWireRow } from './wire-row';

jest.mock('expo-sqlite', () => ({ openDatabaseAsync: jest.fn() }));

const DEST = 'https://navis.test/api/v1|cuenta-1';
const NOW = '2026-10-09T10:00:00.000Z';

let fixture: Awaited<ReturnType<typeof setupLocalDb>>;
beforeAll(async () => {
    fixture = await setupLocalDb({ setDbForTests, openDatabaseMock: openDatabaseAsync });
});
beforeEach(() => fixture.clear());
afterAll(() => fixture.close());

/** El identificador de sincronización de la única fila de una tabla. */
async function onlyEntityId(table: string): Promise<string> {
    const db = await getDb();
    const row = await db.getFirstAsync<LocalRow>(`SELECT * FROM "${table}" LIMIT 1`);
    if (!row) throw new Error(`${table} vacía`);
    const key: Record<string, string> = {};
    for (const column of entityKeyColumns(table)) key[column] = String(row[column]);
    return joinEntityId(table, key);
}

describe('aplicar un cambio del servidor', () => {
    it.each(syncedTables())(
        '%s: una fila que llega del servidor se guarda y se lee igual que salió',
        async (table) => {
            const db = await getDb();
            await insertSample(table);
            const id = await onlyEntityId(table);
            const wire = await readLocalWireRow(db, table, id);
            const where = keyWhere(table, id);
            await db.runAsync(`DELETE FROM "${table}" WHERE ${where.sql}`, ...where.params);

            const outcome = await applyChange(
                db,
                DEST,
                { position: 1, table, id, op: 'upsert', revision: 1, row: wire },
                NOW,
            );

            expect(outcome).toEqual({ kind: 'applied' });
            expect(await readLocalWireRow(db, table, id)).toEqual(wire);
        },
    );

    it('un borrado es lógico si la tabla tiene deleted_at, y la fila no desaparece', async () => {
        const db = await getDb();
        const id = await insertSample('believers');
        await applyChange(
            db,
            DEST,
            { position: 1, table: 'believers', id, op: 'delete', revision: 2, row: null },
            NOW,
        );
        const row = await db.getFirstAsync<{ deleted_at: string | null }>(
            'SELECT deleted_at FROM believers WHERE id = ?',
            id,
        );
        expect(row?.deleted_at).toBe(NOW);
    });

    it('un borrado es físico en las tablas sin borrado lógico', async () => {
        const db = await getDb();
        await insertSample('list_members', { list_id: 'l1', believer_id: 'b1' });
        await applyChange(
            db,
            DEST,
            {
                position: 1,
                table: 'list_members',
                id: 'l1:b1',
                op: 'delete',
                revision: 2,
                row: null,
            },
            NOW,
        );
        expect(await db.getAllAsync('SELECT * FROM list_members')).toEqual([]);
    });

    it('ignora un cambio más viejo que lo que ya se conoce', async () => {
        const db = await getDb();
        const id = await insertSample('believers', { first_name: 'Actual' });
        await rememberRevision(db, DEST, 'believers', id, 5);
        const wire = await readLocalWireRow(db, 'believers', id);

        const outcome = await applyChange(
            db,
            DEST,
            {
                position: 1,
                table: 'believers',
                id,
                op: 'upsert',
                revision: 3,
                row: { ...wire, first_name: 'Antiguo' },
            },
            NOW,
        );
        expect(outcome).toEqual({ kind: 'stale' });
        expect((await readLocalWireRow(db, 'believers', id))?.first_name).toBe('Actual');
    });

    it('no pisa una edición local sin enviar', async () => {
        const db = await getDb();
        await setCaptureDestination(db, DEST);
        const id = await insertSample('believers', { first_name: 'Mía' });
        const wire = await readLocalWireRow(db, 'believers', id);

        const outcome = await applyChange(
            db,
            DEST,
            {
                position: 1,
                table: 'believers',
                id,
                op: 'upsert',
                revision: 1,
                row: { ...wire, first_name: 'Del servidor' },
            },
            NOW,
        );
        expect(outcome).toEqual({ kind: 'deferred' });
        expect((await readLocalWireRow(db, 'believers', id))?.first_name).toBe('Mía');
    });

    it('anota como fallo lo que la base local no acepta, sin tumbar el resto', async () => {
        const db = await getDb();
        const id = await insertSample('believers');
        const wire = await readLocalWireRow(db, 'believers', id);
        const outcome = await applyChange(
            db,
            DEST,
            {
                position: 1,
                table: 'believers',
                id,
                op: 'upsert',
                revision: 1,
                row: { ...wire, first_name: null },
            },
            NOW,
        );
        expect(outcome.kind).toBe('failed');
    });
});
