import {
    ALL_LOCAL_TABLES,
    SYNC_COVERAGE,
    SYNC_PARENTS,
    scopeSql,
    syncedTables,
    triggerStatements,
} from '@navis/shared';
import { DataSource } from 'typeorm';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { dataSourceOptions } from '../database/data-source';
import { SyncPublisher } from './sync-publisher.service';

/**
 * Triggers del registro de cambios sobre un SQLite en memoria con el esquema
 * real. Es lo que garantiza que **todos** los caminos de escritura entran en el
 * registro —incluido `update()` en masa, que no dispara eventos de TypeORM—.
 */
let dataSource: DataSource;
const uuid = () => crypto.randomUUID();

interface ChangeRow {
    table_name: string;
    entity_id: string;
    op: string;
    revision: number;
    church_id: string | null;
    owner_id: string | null;
    position: number | null;
}

const changes = (): Promise<ChangeRow[]> =>
    dataSource.query('SELECT * FROM sync_changes ORDER BY created_at, rowid');

async function insertBeliever(id: string, churchId: string): Promise<void> {
    await dataSource.query(
        `INSERT INTO believers (id, church_id, first_name, last_name, status, search_name) VALUES (?, ?, 'Ana', '', 'activo', 'ana')`,
        [id, churchId],
    );
}

/** Inserta una fila con valores de relleno en las columnas obligatorias. */
async function insertSample(table: string, values: Record<string, string>): Promise<void> {
    const definition = ALL_LOCAL_TABLES.find((one) => one.name === table);
    if (!definition) throw new Error(table);
    const row: Record<string, string | number> = {};
    for (const column of definition.columns) {
        if (column.nullable) continue;
        if (column.default !== undefined) {
            row[column.name] =
                typeof column.default === 'boolean' ? Number(column.default) : column.default;
            continue;
        }
        row[column.name] =
            column.type === 'int' || column.type === 'real' || column.type === 'bool'
                ? 1
                : column.name.endsWith('_at') || column.name.endsWith('_date')
                  ? '2026-03-14'
                  : `${column.name}-x`;
    }
    // Las tablas con clave compuesta no tienen `id`.
    if (definition.columns.some((column) => column.name === 'id')) row.id = uuid();
    Object.assign(row, values);
    const names = Object.keys(row);
    await dataSource.query(
        `INSERT INTO "${table}" (${names.join(', ')}) VALUES (${names.map(() => '?').join(', ')})`,
        Object.values(row),
    );
}

beforeAll(async () => {
    dataSource = new DataSource({
        type: 'better-sqlite3',
        database: ':memory:',
        entities: dataSourceOptions.entities as never[],
        synchronize: true,
    });
    await dataSource.initialize();
    await dataSource.query('PRAGMA foreign_keys = OFF');
    await dataSource.query(
        `INSERT INTO sync_installation (id, generation, capturing) VALUES ('main', 'g', 1)`,
    );
    for (const statement of triggerStatements('sqlite')) await dataSource.query(statement);
});

afterAll(async () => {
    await dataSource.destroy();
});

beforeEach(async () => {
    await dataSource.query('DELETE FROM sync_changes');
    await dataSource.query('DELETE FROM sync_revisions');
});

describe('cobertura de los triggers', () => {
    it('cada tabla sincronizada tiene los tres triggers (módulo nuevo ⇒ CI exige instalarlos)', async () => {
        const found: { name: string }[] = await dataSource.query(
            `SELECT name FROM sqlite_master WHERE type = 'trigger' AND name LIKE 'sync_%'`,
        );
        const names = new Set(found.map((row) => row.name));
        const missing = syncedTables().flatMap((table) =>
            ['ai', 'au', 'ad']
                .map((suffix) => `sync_${table}_${suffix}`)
                .filter((n) => !names.has(n)),
        );
        expect(missing).toEqual([]);
    });

    it('cada tabla hija declara su padre y la columna existe', () => {
        const children = Object.entries(SYNC_COVERAGE)
            .filter(([, entry]) => entry.policy === 'synced' && entry.scope === 'parent')
            .map(([name]) => name);
        expect(children.sort()).toEqual(Object.keys(SYNC_PARENTS).sort());
        for (const child of children) expect(() => scopeSql(child, 'NEW')).not.toThrow();
    });
});

describe('captura de cambios', () => {
    it.each(syncedTables())(
        '%s: insertar, actualizar y borrar no rompe la escritura y deja su rastro',
        async (table) => {
            await insertSample(table, {});
            const definition = ALL_LOCAL_TABLES.find((one) => one.name === table);
            const column = definition?.columns.find((one) => one.name !== 'id')?.name ?? 'id';
            await dataSource.query(
                'UPDATE "' + table + '" SET "' + column + '" = "' + column + '"',
            );
            await dataSource.query('DELETE FROM "' + table + '"');

            const rows = (await changes()).filter((row) => row.table_name === table);
            expect(rows.map((row) => row.op)).toEqual(['upsert', 'upsert', 'delete']);
            expect(rows.every((row) => row.entity_id.length > 0)).toBe(true);
        },
    );

    it('una clave compuesta se registra como el par unido con dos puntos', async () => {
        await insertSample('list_members', { list_id: 'lista-1', believer_id: 'creyente-2' });
        const [change] = (await changes()).filter((row) => row.table_name === 'list_members');
        expect(change?.entity_id).toBe('lista-1:creyente-2');
    });

    it('registra un alta con su iglesia y revisión 1', async () => {
        const church = uuid();
        const id = uuid();
        await insertBeliever(id, church);

        const [change] = await changes();
        expect(change).toMatchObject({
            table_name: 'believers',
            entity_id: id,
            op: 'upsert',
            revision: 1,
            church_id: church,
            owner_id: null,
            position: null,
        });
    });

    it('un update en masa (sin eventos de TypeORM) sube la revisión', async () => {
        const id = uuid();
        await insertBeliever(id, uuid());
        await dataSource.getRepository('Believer').update({ id }, { firstName: 'Otra' });

        const rows = await changes();
        expect(rows.map((row) => row.revision)).toEqual([1, 2]);
    });

    it('un borrado lógico se registra como borrado y uno físico también', async () => {
        const id = uuid();
        await insertBeliever(id, uuid());
        await dataSource.query(`UPDATE believers SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?`, [
            id,
        ]);
        await dataSource.query(`DELETE FROM believers WHERE id = ?`, [id]);

        expect((await changes()).map((row) => row.op)).toEqual(['upsert', 'delete', 'delete']);
    });

    it('una fila hija hereda la iglesia de su padre', async () => {
        const church = uuid();
        const believer = uuid();
        await insertBeliever(believer, church);
        await dataSource.query(
            `INSERT INTO believer_ministries (id, believer_id, ministry) VALUES (?, ?, 'musica')`,
            [uuid(), believer],
        );

        const child = (await changes()).find((row) => row.table_name === 'believer_ministries');
        expect(child?.church_id).toBe(church);
    });

    it('un dato personal lleva su dueño y no tiene iglesia', async () => {
        await insertSample('prophecies', { owner_id: 'u1' });
        const change = (await changes()).find((row) => row.table_name === 'prophecies');
        expect(change).toMatchObject({ church_id: null, owner_id: 'u1' });
    });

    it('no registra nada si la captura está apagada', async () => {
        await dataSource.query(`UPDATE sync_installation SET capturing = 0`);
        await insertBeliever(uuid(), uuid());
        await dataSource.query(`UPDATE sync_installation SET capturing = 1`);
        expect(await changes()).toEqual([]);
    });
});

describe('publicación', () => {
    it('reparte posiciones consecutivas sin huecos, y lo que llega después recibe posiciones mayores', async () => {
        const publisher = new SyncPublisher(dataSource);
        await insertBeliever(uuid(), uuid());
        await insertBeliever(uuid(), uuid());
        await publisher.publish();
        const first = (await changes()).map((row) => row.position).sort();
        expect(first).toEqual([1, 2]);

        await insertBeliever(uuid(), uuid());
        await Promise.all([publisher.publish(), publisher.publish()]);
        const all = (await changes()).map((row) => row.position).sort();
        expect(all).toEqual([1, 2, 3]);
    });
});
