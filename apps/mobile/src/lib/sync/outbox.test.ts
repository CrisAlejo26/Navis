import { setupLocalDb } from '@/data/test-support';
import { ALL_LOCAL_TABLES, syncedTables } from '@navis/shared';
import { openDatabaseAsync } from 'expo-sqlite';

import { getDb, setDbForTests } from '@/data/db';

import { setCaptureDestination, withoutCapture } from './capture';
import { insertSample } from './test-rows';
import { markDone, outboxCounts, releaseForRetry, takeBatch } from './outbox';

jest.mock('expo-sqlite', () => ({ openDatabaseAsync: jest.fn() }));

const DEST = 'https://navis.test/api/v1|cuenta-1';

let fixture: Awaited<ReturnType<typeof setupLocalDb>>;
beforeAll(async () => {
    fixture = await setupLocalDb({ setDbForTests, openDatabaseMock: openDatabaseAsync });
});
beforeEach(() => fixture.clear());
afterAll(() => fixture.close());

async function queue(): Promise<
    { table_name: string; entity_id: string; op: string; state: string }[]
> {
    const db = await getDb();
    return db.getAllAsync('SELECT table_name, entity_id, op, state FROM sync_outbox ORDER BY seq');
}

describe('registro de cambios locales', () => {
    it('sin destino vinculado no apunta nada', async () => {
        await insertSample('believers');
        expect(await queue()).toEqual([]);
    });

    it('con destino, cada escritura queda en la cola y las ediciones seguidas se funden', async () => {
        const db = await getDb();
        await setCaptureDestination(db, DEST);
        const id = await insertSample('believers');
        await db.runAsync("UPDATE believers SET first_name = 'Uno' WHERE id = ?", id);
        await db.runAsync("UPDATE believers SET first_name = 'Dos' WHERE id = ?", id);

        expect(await queue()).toEqual([
            { table_name: 'believers', entity_id: id, op: 'upsert', state: 'pending' },
        ]);
        await db.runAsync('DELETE FROM believers WHERE id = ?', id);
        expect((await queue())[0]?.op).toBe('delete');
    });

    it('lo que se aplica desde el servidor no vuelve a la cola', async () => {
        const db = await getDb();
        await setCaptureDestination(db, DEST);
        await withoutCapture(db, async () => {
            await insertSample('believers');
        });
        expect(await queue()).toEqual([]);
        // y la captura vuelve a funcionar después
        await insertSample('believers');
        expect(await queue()).toHaveLength(1);
    });

    it('una clave compuesta se apunta como el par unido con dos puntos', async () => {
        const db = await getDb();
        await setCaptureDestination(db, DEST);
        await insertSample('list_members', { list_id: 'lista-1', believer_id: 'creyente-2' });
        expect((await queue())[0]?.entity_id).toBe('lista-1:creyente-2');
    });

    it.each(syncedTables())(
        '%s: insertar, actualizar y borrar no rompe la escritura local',
        async (table) => {
            const db = await getDb();
            await setCaptureDestination(db, DEST);
            await insertSample(table);
            const definition = ALL_LOCAL_TABLES.find((one) => one.name === table);
            const column = definition?.columns.find((one) => one.name !== 'id')?.name ?? 'id';
            await db.runAsync(`UPDATE "${table}" SET "${column}" = "${column}"`);
            await db.runAsync(`DELETE FROM "${table}"`);
            const rows = (await queue()).filter((row) => row.table_name === table);
            expect(rows).toHaveLength(1);
            expect(rows[0]?.op).toBe('delete');
        },
    );
});

describe('tanda de envío', () => {
    it('lo que quedó enviándose se reenvía con el mismo identificador de operación', async () => {
        const db = await getDb();
        await setCaptureDestination(db, DEST);
        const id = await insertSample('believers');

        const [first] = await takeBatch(db, DEST, 10);
        expect(first?.state).toBe('sending');
        const operationId = first?.operation_id;
        expect(operationId).toBeTruthy();

        // La app se cierra sin recibir respuesta y vuelve a pedir la tanda.
        const [again] = await takeBatch(db, DEST, 10);
        expect(again?.operation_id).toBe(operationId);
        expect(again?.entity_id).toBe(id);
    });

    it('la segunda edición espera a que se confirme la primera (encadenadas)', async () => {
        const db = await getDb();
        await setCaptureDestination(db, DEST);
        const id = await insertSample('believers');
        await takeBatch(db, DEST, 10); // la primera sale (queda enviándose)
        await db.runAsync("UPDATE believers SET first_name = 'Nuevo' WHERE id = ?", id);

        expect(await outboxCounts(db, DEST)).toMatchObject({ pending: 2 });
        const batch = await takeBatch(db, DEST, 10);
        expect(batch).toHaveLength(1); // solo una por entidad en la misma tanda
        expect(batch[0]?.state).toBe('sending');

        await markDone(db, DEST, batch[0], 3);
        const next = await takeBatch(db, DEST, 10);
        expect(next).toHaveLength(1);
        expect(next[0]?.op).toBe('upsert');
    });

    it('no envía la cola de un destino a otro', async () => {
        const db = await getDb();
        await setCaptureDestination(db, DEST);
        await insertSample('believers');
        expect(await takeBatch(db, 'otra-instalacion|otra-cuenta', 10)).toEqual([]);
    });

    it('devolver una operación a pendiente libera su identificador', async () => {
        const db = await getDb();
        await setCaptureDestination(db, DEST);
        await insertSample('believers');
        const [row] = await takeBatch(db, DEST, 10);
        await releaseForRetry(db, row, 'unsupported-table');
        const [retry] = await takeBatch(db, DEST, 10);
        expect(retry?.operation_id).not.toBe(row?.operation_id);
    });
});
