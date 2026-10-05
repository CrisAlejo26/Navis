import { ALL_LOCAL_TABLES, LOCAL_INDEXES, createIndexSql, createTableSql } from '@navis/shared';
import type { LocalDb } from './local-db';

export async function migrateTables(db: LocalDb): Promise<void> {
    const existing = new Set(
        (
            await db.getAllAsync<{ name: string }>(
                "SELECT name FROM sqlite_master WHERE type = 'table'",
            )
        ).map((row) => row.name),
    );
    for (const table of ALL_LOCAL_TABLES) {
        if (!table.name.startsWith('custom_table') || existing.has(table.name)) continue;
        await db.execAsync(createTableSql(table));
    }
    for (const index of LOCAL_INDEXES) {
        if (!index.table.startsWith('custom_table')) continue;
        await db.execAsync(
            createIndexSql(index).replace(
                /^CREATE (UNIQUE )?INDEX/,
                'CREATE $1INDEX IF NOT EXISTS',
            ),
        );
    }
}

async function hasColumn(db: LocalDb, table: string, column: string): Promise<boolean> {
    const columns = await db.getAllAsync<{ name: string }>(`PRAGMA table_info(${table})`);
    return columns.some((one) => one.name === column);
}

/**
 * Deja las tablas personalizadas con las columnas exactas de la API
 * (`local-schema.parity.test.ts`): `custom_tables.created_by` se añade, y
 * `deleted_at` desaparece de columnas y vistas — la API desactiva las columnas
 * con `is_active` y borra las vistas de verdad. Se escribe como migración nueva
 * y no sobre `migrateTables` porque esa ya se aplicó en teléfonos y emuladores.
 */
export async function migrateTablesParity(db: LocalDb): Promise<void> {
    if (!(await hasColumn(db, 'custom_tables', 'created_by'))) {
        await db.execAsync('ALTER TABLE custom_tables ADD COLUMN created_by TEXT');
    }
    if (await hasColumn(db, 'custom_table_columns', 'deleted_at')) {
        await db.execAsync(
            'UPDATE custom_table_columns SET is_active = 0 WHERE deleted_at IS NOT NULL',
        );
        await db.execAsync('ALTER TABLE custom_table_columns DROP COLUMN deleted_at');
    }
    if (await hasColumn(db, 'custom_table_views', 'deleted_at')) {
        await db.execAsync('DELETE FROM custom_table_views WHERE deleted_at IS NOT NULL');
        await db.execAsync('ALTER TABLE custom_table_views DROP COLUMN deleted_at');
    }
}
