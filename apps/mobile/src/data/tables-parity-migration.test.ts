import { setupLocalDb } from './test-support';
import { setDbForTests } from './db';
import { migrateTablesParity } from './tables-migration';
import { openDatabaseAsync } from 'expo-sqlite';

jest.mock('expo-sqlite', () => ({ openDatabaseAsync: jest.fn() }));

let fixture: Awaited<ReturnType<typeof setupLocalDb>>;
beforeAll(async () => {
    fixture = await setupLocalDb({ setDbForTests, openDatabaseMock: openDatabaseAsync });
});
afterAll(() => fixture.close());

async function columnNames(table: string): Promise<string[]> {
    const rows = await fixture.adapter.getAllAsync<{ name: string }>(`PRAGMA table_info(${table})`);
    return rows.map((row) => row.name);
}

// Protege el esquema 15: un teléfono con las tablas personalizadas del esquema 13
// (con `deleted_at` en columnas y vistas, sin `created_by`) queda con las columnas
// de la API sin perder lo vigente ni resucitar lo borrado.
describe('migrateTablesParity', () => {
    beforeAll(async () => {
        const db = fixture.adapter;
        await db.execAsync(`
            DROP TABLE custom_table_columns; DROP TABLE custom_table_views; DROP TABLE custom_tables;
            CREATE TABLE custom_tables (id TEXT PRIMARY KEY, created_at TEXT, updated_at TEXT, deleted_at TEXT,
                church_id TEXT, name TEXT, slug TEXT, icon TEXT, accent TEXT, position INTEGER, is_active INTEGER, source TEXT);
            CREATE TABLE custom_table_columns (id TEXT PRIMARY KEY, created_at TEXT, updated_at TEXT, deleted_at TEXT,
                table_id TEXT, key TEXT, label TEXT, type TEXT, position INTEGER, required INTEGER, options TEXT,
                config TEXT, is_active INTEGER, believer_field TEXT);
            CREATE TABLE custom_table_views (id TEXT PRIMARY KEY, created_at TEXT, updated_at TEXT, deleted_at TEXT,
                table_id TEXT, name TEXT, type TEXT, group_by TEXT, date_column TEXT, filters TEXT, sort_by TEXT,
                sort_order TEXT, position INTEGER);
            INSERT INTO custom_table_columns (id, table_id, key, is_active, deleted_at) VALUES
                ('c1', 't', 'a', 1, NULL), ('c2', 't', 'b', 0, '2026-01-01');
            INSERT INTO custom_table_views (id, table_id, name, deleted_at) VALUES
                ('v1', 't', 'viva', NULL), ('v2', 't', 'borrada', '2026-01-01');
        `);
        await migrateTablesParity(db);
    });

    it('añade created_by y quita deleted_at de columnas y vistas', async () => {
        expect(await columnNames('custom_tables')).toContain('created_by');
        expect(await columnNames('custom_table_columns')).not.toContain('deleted_at');
        expect(await columnNames('custom_table_views')).not.toContain('deleted_at');
    });

    it('conserva las columnas vigentes y deja desactivada la borrada', async () => {
        const rows = await fixture.adapter.getAllAsync<{ id: string; is_active: number }>(
            'SELECT id, is_active FROM custom_table_columns ORDER BY id',
        );
        expect(rows).toEqual([
            { id: 'c1', is_active: 1 },
            { id: 'c2', is_active: 0 },
        ]);
    });

    it('conserva las vistas vigentes y elimina las borradas', async () => {
        const rows = await fixture.adapter.getAllAsync<{ id: string }>(
            'SELECT id FROM custom_table_views',
        );
        expect(rows).toEqual([{ id: 'v1' }]);
    });

    it('es idempotente', async () => {
        await expect(migrateTablesParity(fixture.adapter)).resolves.toBeUndefined();
    });
});
