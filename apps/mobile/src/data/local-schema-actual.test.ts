import { setupLocalDb } from './test-support';
import { ALL_LOCAL_TABLES, type LocalColumnType } from '@navis/shared';
import { openDatabaseAsync } from 'expo-sqlite';

import { LEGACY_COLUMNS } from '../lib/backup/backup-format';
import { setDbForTests } from './db';

jest.mock('expo-sqlite', () => ({ openDatabaseAsync: jest.fn() }));

interface TableInfoRow {
    name: string;
    type: string;
    notnull: number;
    pk: number;
}

const AFFINITY: Record<LocalColumnType, string> = {
    text: 'TEXT',
    int: 'INTEGER',
    bool: 'INTEGER',
    real: 'REAL',
};

let fixture: Awaited<ReturnType<typeof setupLocalDb>>;
beforeAll(async () => {
    fixture = await setupLocalDb({ setDbForTests, openDatabaseMock: openDatabaseAsync });
});
afterAll(() => fixture.close());

/**
 * Una base que pasa por **todas** las migraciones reales (el camino de un
 * teléfono con meses de uso, versión a versión) acaba con las columnas que
 * declara `@navis/shared`. Cierra el triángulo de la Fase 2 de sincronización:
 * la API ↔ lo declarado lo comprueba la suite de la API; esto comprueba lo
 * declarado ↔ lo que de verdad hay en SQLite.
 */
describe.each(ALL_LOCAL_TABLES.map((table) => [table.name, table] as const))(
    'esquema real de %s',
    (_name, table) => {
        it('tiene las columnas, el tipo y la anulabilidad declarados', async () => {
            const rows = await fixture.adapter.getAllAsync<TableInfoRow>(
                `PRAGMA table_info("${table.name}")`,
            );
            // Las columnas heredadas (`believers.featured_tag_id`) existen a propósito:
            // el protocolo las traduce con `sync-legacy`.
            const declared = [
                ...table.columns.map((column) => column.name),
                ...(LEGACY_COLUMNS[table.name] ?? []),
            ];
            expect(rows.map((row) => row.name).sort()).toEqual(declared.sort());

            const drift: string[] = [];
            for (const column of table.columns) {
                const actual = rows.find((row) => row.name === column.name);
                if (!actual) continue;
                if (actual.type.toUpperCase() !== AFFINITY[column.type]) {
                    drift.push(`${column.name}: tipo ${actual.type} ≠ ${AFFINITY[column.type]}`);
                }
                if (!column.pk && Boolean(actual.notnull) === Boolean(column.nullable)) {
                    drift.push(`${column.name}: anulabilidad`);
                }
            }
            expect(drift).toEqual([]);
        });
    },
);
