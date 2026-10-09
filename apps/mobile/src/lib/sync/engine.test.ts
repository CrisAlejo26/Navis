import { setupLocalDb } from '@/data/test-support';
import type { WireObject } from '@navis/shared';
import { openDatabaseAsync } from 'expo-sqlite';

import { getDb, setDbForTests } from '@/data/db';
import { decryptCell, encryptCell } from '@/lib/tables/crypto';

import { setCaptureDestination } from './capture';
import { runSync, type SyncRunResult } from './engine';
import { FakeSyncServer } from './fake-sync-server';
import { insertSample, testUuid } from './test-rows';
import { readLocalWireRow } from './wire-row';

jest.mock('expo-sqlite', () => ({ openDatabaseAsync: jest.fn() }));

const DEST = 'https://navis.test/api/v1|cuenta-1';

let fixture: Awaited<ReturnType<typeof setupLocalDb>>;
let server: FakeSyncServer;

beforeAll(async () => {
    fixture = await setupLocalDb({ setDbForTests, openDatabaseMock: openDatabaseAsync });
});
beforeEach(async () => {
    await fixture.clear();
    server = new FakeSyncServer();
    await setCaptureDestination(await getDb(), DEST);
});
afterAll(() => fixture.close());

const sync = async (destination = DEST, freeSpace?: () => number): Promise<SyncRunResult> =>
    runSync({ db: await getDb(), api: server, destination, freeSpace });

async function outbox(): Promise<
    { state: string; operation_id: string | null; entity_id: string }[]
> {
    const db = await getDb();
    return db.getAllAsync('SELECT state, operation_id, entity_id FROM sync_outbox ORDER BY seq');
}

async function nameOf(id: string): Promise<string | undefined> {
    const db = await getDb();
    return (
        await db.getFirstAsync<{ first_name: string }>(
            'SELECT first_name FROM believers WHERE id = ?',
            id,
        )
    )?.first_name;
}

/** Una fila de creyente con la forma del protocolo, como la mandaría otro cliente. */
async function remoteBeliever(
    values: Record<string, string> = {},
): Promise<{ id: string; row: WireObject }> {
    const db = await getDb();
    await setCaptureDestination(db, null); // para que prepararla no cuente como edición local
    const id = await insertSample('believers', values);
    const row = await readLocalWireRow(db, 'believers', id);
    await db.runAsync('DELETE FROM believers WHERE id = ?', id);
    await setCaptureDestination(db, DEST);
    if (!row) throw new Error('fila no preparada');
    return { id, row };
}

describe('motor de sincronización del móvil', () => {
    it('trabaja sin red en varias iglesias y al volver la red lo sube todo, sin perder nada', async () => {
        server.online = false;
        await insertSample('believers', { church_id: 'iglesia-a' });
        await insertSample('believers', { church_id: 'iglesia-b' });
        await insertSample('believer_notes', { church_id: 'iglesia-b' });

        const offline = await sync();
        expect(offline.state).toBe('offline');
        expect(offline.counts.pending).toBe(3);

        server.online = true;
        const online = await sync();
        expect(online.state).toBe('connected');
        expect(online.counts.pending).toBe(0);
        expect(server.executed).toBe(3);
        expect(await outbox()).toEqual([]);
    });

    it('una respuesta perdida no duplica la operación: se reenvía con el mismo identificador', async () => {
        await insertSample('believers');
        server.loseNextResponse = true;

        expect((await sync()).state).toBe('offline');
        const [stuck] = await outbox();
        expect(stuck?.state).toBe('sending');
        expect(stuck?.operation_id).toBeTruthy();

        expect((await sync()).state).toBe('connected');
        expect(server.executed).toBe(1);
        expect(await outbox()).toEqual([]);
    });

    it('las ediciones sucesivas se encadenan sobre la revisión que dejó la anterior', async () => {
        const id = await insertSample('believers');
        await sync();
        expect(server.revisionOf('believers', id)).toBe(1);

        const db = await getDb();
        await db.runAsync("UPDATE believers SET first_name = 'Segunda' WHERE id = ?", id);
        const second = await sync();

        expect(second.state).toBe('connected'); // ningún conflicto contra sí misma
        expect(server.revisionOf('believers', id)).toBe(2);
        expect(server.rows.get(`believers:${id}`)).toMatchObject({ first_name: 'Segunda' });
    });

    it('lo que baja del servidor se aplica sin volver a subir y el cursor avanza', async () => {
        const { id, row } = await remoteBeliever({ first_name: 'Remoto' });
        server.remote('believers', id, row);

        const result = await sync();
        expect(result.pull.applied).toBe(1);
        expect(await nameOf(id)).toBe('Remoto');
        expect(await outbox()).toEqual([]);

        const again = await sync();
        expect(again.pull.applied).toBe(0);
    });

    it('una descarga no pisa lo que aún no se ha subido: sale como conflicto y la edición local se conserva', async () => {
        const id = await insertSample('believers', { first_name: 'Original' });
        await sync();
        const wire = await readLocalWireRow(await getDb(), 'believers', id);
        const db = await getDb();
        await db.runAsync("UPDATE believers SET first_name = 'Local' WHERE id = ?", id);
        server.remote('believers', id, { ...wire, first_name: 'Remoto' });

        const result = await sync();

        expect(result.state).toBe('conflicts');
        expect(result.counts.conflicts).toBe(1);
        expect(await nameOf(id)).toBe('Local');
        const conflict = await db.getFirstAsync<{ reason: string; remote_revision: number }>(
            'SELECT reason, remote_revision FROM sync_conflicts',
        );
        expect(conflict).toEqual({ reason: 'field-conflict', remote_revision: 2 });
    });

    it('un 401 detiene el transporte y conserva la cola', async () => {
        await insertSample('believers');
        server.authorized = false;
        const result = await sync();
        expect(result.state).toBe('needsAuth');
        expect(result.counts.pending).toBe(1);
    });

    it('si la instalación cambió, pide rehacer la descarga y no toca la cola', async () => {
        const { id, row } = await remoteBeliever();
        server.remote('believers', id, row);
        await sync();
        await insertSample('believers');

        server.generation = 'g2';
        const result = await sync();
        expect(result.state).toBe('rebase');
        expect(result.counts.pending).toBe(1);
    });

    it('con la sincronización apagada en el servidor no envía ni descarga nada', async () => {
        await insertSample('believers');
        server.enabled = false;
        const result = await sync();
        expect(result.state).toBe('disabled');
        expect(server.calls).toEqual(['capabilities']);
        expect(result.counts.pending).toBe(1);
    });

    it('una tabla que el servidor aún no aplica se queda en la cola sin reintentarse en bucle', async () => {
        await insertSample('lists');
        const result = await sync();
        expect(result.state).toBe('connected');
        expect(result.counts.pending).toBe(1);
        expect(server.calls.filter((call) => call === 'operations')).toHaveLength(1);
    });

    it('sin espacio sube lo pendiente pero no aplica descargas, y no pierde nada', async () => {
        const { id, row } = await remoteBeliever({ first_name: 'Remoto' });
        server.remote('believers', id, row);
        const mine = await insertSample('believers', { first_name: 'Mía' });

        const result = await sync(DEST, () => 1024);

        expect(result.state).toBe('lowStorage');
        expect(result.push.sent).toBe(1); // lo suyo sale
        expect(server.revisionOf('believers', mine)).toBe(1);
        expect(result.pull.pages).toBe(0); // no se descargó nada
        expect(await nameOf(id)).toBeUndefined();

        const later = await sync(DEST, () => 10 * 1024 * 1024 * 1024);
        expect(later.state).toBe('connected');
        expect(await nameOf(id)).toBe('Remoto'); // al liberar espacio, todo llega
    });

    it('la cola de un destino no se envía a otro', async () => {
        await insertSample('believers');
        const result = await sync('https://otra.instalacion/api/v1|cuenta-2');
        expect(result.push.sent).toBe(0);
        expect(server.executed).toBe(0);
        expect(await outbox()).toHaveLength(1);
    });

    describe('contraseñas de tablas personalizadas', () => {
        it('suben en claro (no el sobre del aparato) y bajan selladas con la clave de este aparato', async () => {
            const tableId = testUuid();
            await insertSample('custom_table_columns', {
                table_id: tableId,
                key: 'clave',
                type: 'password',
            });
            const rowId = await insertSample('custom_table_rows', {
                table_id: tableId,
                data: JSON.stringify({ clave: await encryptCell('portal-2026') }),
            });

            await sync();
            const sent = server.rows.get(`custom_table_rows:${rowId}`);
            expect(String(sent?.data)).toContain('portal-2026');
            expect(String(sent?.data)).not.toContain('navisCipher');

            // Y a la inversa: otro cliente cambia la contraseña en claro.
            const db = await getDb();
            server.remote('custom_table_rows', rowId, {
                ...sent,
                data: JSON.stringify({ clave: 'otra-clave-2026' }),
            });
            await sync();
            const stored = await db.getFirstAsync<{ data: string }>(
                'SELECT data FROM custom_table_rows WHERE id = ?',
                rowId,
            );
            expect(stored?.data).toContain('navisCipher');
            expect(stored?.data).not.toContain('otra-clave-2026');
            const cell = (JSON.parse(stored?.data ?? '{}') as { clave: unknown }).clave;
            expect(await decryptCell(cell)).toBe('otra-clave-2026');
        });
    });
});
