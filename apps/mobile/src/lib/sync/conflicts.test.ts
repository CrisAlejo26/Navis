import { setupLocalDb } from '@/data/test-support';
import type { WireObject } from '@navis/shared';
import { openDatabaseAsync } from 'expo-sqlite';

import { getDb, setDbForTests } from '@/data/db';
import { decryptCell, encryptCell } from '@/lib/tables/crypto';

import { setCaptureDestination } from './capture';
import { listOpenConflicts } from './conflicts-store';
import { runSync, type SyncRunResult } from './engine';
import { FakeSyncServer } from './fake-sync-server';
import { resolveConflict, type Decision } from './resolve-conflict';
import { insertSample, testUuid } from './test-rows';
import { readLocalWireRow } from './wire-row';

jest.mock('expo-sqlite', () => ({ openDatabaseAsync: jest.fn() }));

const DEST = 'https://navis.test/api/v1|cuenta-1';
const NOW = '2026-10-09T10:00:00.000Z';

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

const sync = async (): Promise<SyncRunResult> =>
    runSync({ db: await getDb(), api: server, destination: DEST });

const resolve = async (id: number, decision: Decision) =>
    resolveConflict(await getDb(), DEST, id, decision, NOW);

async function field(id: string, name: string): Promise<unknown> {
    const db = await getDb();
    const row = await db.getFirstAsync<Record<string, unknown>>(
        'SELECT * FROM believers WHERE id = ?',
        id,
    );
    return row?.[name];
}

async function edit(id: string, set: string, value: string): Promise<void> {
    const db = await getDb();
    await db.runAsync(`UPDATE believers SET ${set} = ? WHERE id = ?`, value, id);
}

/** Un creyente ya sincronizado: la base de la comparación a tres bandas. */
async function synced(
    values: Record<string, string> = {},
): Promise<{ id: string; wire: WireObject }> {
    const id = await insertSample('believers', { first_name: 'Original', ...values });
    await sync();
    const wire = await readLocalWireRow(await getDb(), 'believers', id);
    if (!wire) throw new Error('sin fila');
    return { id, wire };
}

describe('campos independientes', () => {
    it('cada lado cambió un campo distinto: se fusionan solos y la fusión se sube', async () => {
        const { id, wire } = await synced();
        await edit(id, 'phone', '222');
        server.remote('believers', id, { ...wire, arrival_site: 'Petrer' });

        const result = await sync();

        expect(result.state).toBe('connected');
        expect(result.reconcile.merged).toBe(1);
        expect(await field(id, 'phone')).toBe('222');
        expect(await field(id, 'arrival_site')).toBe('Petrer');
        expect(server.rows.get(`believers:${id}`)).toMatchObject({
            phone: '222',
            arrival_site: 'Petrer',
        });
        expect(server.revisionOf('believers', id)).toBe(3);
    });
});

describe('el mismo campo cambiado en los dos lados', () => {
    async function conflicted() {
        const { id, wire } = await synced();
        await edit(id, 'first_name', 'Local');
        server.remote('believers', id, { ...wire, first_name: 'Remoto' });
        const result = await sync();
        const [conflict] = await listOpenConflicts(await getDb(), DEST);
        if (!conflict) throw new Error('sin conflicto');
        return { id, result, conflict };
    }

    it('se conserva todo y decide una persona, sin que gane «el último»', async () => {
        const { id, result, conflict } = await conflicted();
        expect(result.state).toBe('conflicts');
        expect(conflict.kind).toBe('fields');
        expect(JSON.parse(conflict.fields_json ?? '[]')).toEqual(['first_name']);
        expect(await field(id, 'first_name')).toBe('Local');
        expect(server.rows.get(`believers:${id}`)).toMatchObject({ first_name: 'Remoto' });
        expect(server.executed).toBe(1); // solo la subida inicial: lo local no se envió a ciegas
    });

    it('al elegir lo del servidor, el teléfono se queda con eso', async () => {
        const { id, conflict } = await conflicted();
        expect(
            await resolve(conflict.id, { kind: 'fields', choices: { first_name: 'remote' } }),
        ).toBe('resolved');
        expect((await sync()).state).toBe('connected');
        expect(await field(id, 'first_name')).toBe('Remoto');
        expect(await listOpenConflicts(await getDb(), DEST)).toEqual([]);
    });

    it('al elegir lo local, sube sobre la revisión del servidor', async () => {
        const { id, conflict } = await conflicted();
        await resolve(conflict.id, { kind: 'fields', choices: { first_name: 'local' } });
        expect((await sync()).state).toBe('connected');
        expect(server.rows.get(`believers:${id}`)).toMatchObject({ first_name: 'Local' });
        expect(server.revisionOf('believers', id)).toBe(3);
    });

    it('un valor combinado escrito a mano también vale (no se concatena solo)', async () => {
        const { id, conflict } = await conflicted();
        await resolve(conflict.id, {
            kind: 'fields',
            choices: { first_name: { custom: 'Local y Remoto' } },
        });
        await sync();
        expect(await field(id, 'first_name')).toBe('Local y Remoto');
        expect(server.rows.get(`believers:${id}`)).toMatchObject({ first_name: 'Local y Remoto' });
    });

    it('rechaza una decisión incompleta o de otro tipo y no cambia nada', async () => {
        const { id, conflict } = await conflicted();
        expect(await resolve(conflict.id, { kind: 'fields', choices: {} })).toBe('invalid');
        expect(
            await resolve(conflict.id, { kind: 'remote-deleted', choice: 'accept-deletion' }),
        ).toBe('invalid');
        expect(await field(id, 'first_name')).toBe('Local');
        expect(await listOpenConflicts(await getDb(), DEST)).toHaveLength(1);
    });

    it('si otro editó mientras se decidía, se vuelve a comparar y no se pisa', async () => {
        const { id, wire, conflict } = await (async () => {
            const c = await conflicted();
            const wire = (await readLocalWireRow(await getDb(), 'believers', c.id)) ?? {};
            return { ...c, wire };
        })();
        await resolve(conflict.id, { kind: 'fields', choices: { first_name: 'local' } });
        // Antes de sincronizar, la web cambia OTRO campo.
        server.remote('believers', id, {
            ...(server.rows.get(`believers:${id}`) ?? wire),
            arrival_site: 'Elda',
        });

        const result = await sync();

        expect(result.state).toBe('connected');
        expect(await field(id, 'first_name')).toBe('Local');
        expect(await field(id, 'arrival_site')).toBe('Elda'); // lo de la web llegó
        expect(server.rows.get(`believers:${id}`)).toMatchObject({
            first_name: 'Local',
            arrival_site: 'Elda',
        });
    });
});

describe('borrado contra edición', () => {
    it('borrado en el servidor + edición local: no se resucita ni se borra solo', async () => {
        const { id } = await synced();
        await edit(id, 'first_name', 'Editado');
        server.remote('believers', id, null);

        const result = await sync();
        const [conflict] = await listOpenConflicts(await getDb(), DEST);

        expect(result.state).toBe('conflicts');
        expect(conflict?.kind).toBe('remote-deleted');
        expect(await field(id, 'first_name')).toBe('Editado');
        expect(await field(id, 'deleted_at')).toBeNull();
    });

    it('aceptar el borrado lo aplica y no sube la edición', async () => {
        const { id } = await synced();
        await edit(id, 'first_name', 'Editado');
        server.remote('believers', id, null);
        await sync();
        const [conflict] = await listOpenConflicts(await getDb(), DEST);

        await resolve(conflict.id, { kind: 'remote-deleted', choice: 'accept-deletion' });
        const executedBefore = server.executed;
        await sync();

        expect(await field(id, 'deleted_at')).not.toBeNull();
        expect(server.executed).toBe(executedBefore);
    });

    it('conservar lo mío lo vuelve a subir sobre la revisión del borrado', async () => {
        const { id } = await synced();
        await edit(id, 'first_name', 'Editado');
        server.remote('believers', id, null);
        await sync();
        const [conflict] = await listOpenConflicts(await getDb(), DEST);

        await resolve(conflict.id, { kind: 'remote-deleted', choice: 'keep-mine' });
        expect((await sync()).state).toBe('connected');
        expect(server.rows.get(`believers:${id}`)).toMatchObject({ first_name: 'Editado' });
    });

    it('borrado local + edición en el servidor: se pregunta, y mantener lo remoto restaura la fila', async () => {
        const { id, wire } = await synced();
        const db = await getDb();
        await db.runAsync('DELETE FROM believers WHERE id = ?', id);
        server.remote('believers', id, { ...wire, first_name: 'Remoto' });

        const result = await sync();
        const [conflict] = await listOpenConflicts(db, DEST);
        expect(result.state).toBe('conflicts');
        expect(conflict?.kind).toBe('local-deleted');
        expect(await field(id, 'first_name')).toBeUndefined();

        await resolve(conflict.id, { kind: 'local-deleted', choice: 'keep-remote' });
        await sync();
        expect(await field(id, 'first_name')).toBe('Remoto');
    });

    it('borrado local + edición en el servidor: confirmar el borrado lo sube', async () => {
        const { id, wire } = await synced();
        const db = await getDb();
        await db.runAsync('DELETE FROM believers WHERE id = ?', id);
        server.remote('believers', id, { ...wire, first_name: 'Remoto' });
        await sync();
        const [conflict] = await listOpenConflicts(db, DEST);

        await resolve(conflict.id, { kind: 'local-deleted', choice: 'delete' });
        expect((await sync()).state).toBe('connected');
        expect(server.rows.get(`believers:${id}`)).toBeNull();
    });

    it('si los dos lados lo borraron no hay conflicto', async () => {
        const { id } = await synced();
        const db = await getDb();
        await db.runAsync('DELETE FROM believers WHERE id = ?', id);
        server.remote('believers', id, null);

        const result = await sync();
        expect(result.state).toBe('connected');
        expect(await listOpenConflicts(db, DEST)).toEqual([]);
        expect(result.counts.pending).toBe(0);
    });
});

describe('contraseñas de tablas personalizadas', () => {
    async function rowWithPassword() {
        const tableId = testUuid();
        await insertSample('custom_table_columns', {
            table_id: tableId,
            key: 'clave',
            type: 'password',
        });
        const rowId = await insertSample('custom_table_rows', {
            table_id: tableId,
            data: JSON.stringify({ clave: await encryptCell('uno'), nota: 'a' }),
        });
        await sync();
        return { rowId };
    }

    it('una contraseña editada aquí y otra celda editada en el servidor se fusionan sin conflicto', async () => {
        const { rowId } = await rowWithPassword();
        const db = await getDb();
        const sent = server.rows.get(`custom_table_rows:${rowId}`) ?? {};
        await db.runAsync(
            'UPDATE custom_table_rows SET data = ? WHERE id = ?',
            JSON.stringify({ clave: await encryptCell('dos'), nota: 'a' }),
            rowId,
        );
        server.remote('custom_table_rows', rowId, {
            ...sent,
            data: JSON.stringify({ clave: 'uno', nota: 'b' }),
        });

        const result = await sync();

        expect(result.state).toBe('connected');
        const stored = await db.getFirstAsync<{ data: string }>(
            'SELECT data FROM custom_table_rows WHERE id = ?',
            rowId,
        );
        const data = JSON.parse(stored?.data ?? '{}') as { clave: unknown; nota: string };
        expect(data.nota).toBe('b');
        expect(await decryptCell(data.clave)).toBe('dos');
        expect(String(server.rows.get(`custom_table_rows:${rowId}`)?.data)).toContain(
            '"clave":"dos"',
        );
    });

    it('la versión base no guarda ninguna contraseña en claro, solo su huella', async () => {
        const { rowId } = await rowWithPassword();
        const db = await getDb();
        const state = await db.getFirstAsync<{ base_json: string }>(
            'SELECT base_json FROM sync_entity_state WHERE entity_id = ?',
            rowId,
        );
        expect(state?.base_json).toContain('fp:');
        expect(state?.base_json).not.toContain('uno');
    });
});
