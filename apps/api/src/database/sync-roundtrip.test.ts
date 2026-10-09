import {
    ALL_LOCAL_TABLES,
    columnKind,
    decodeRow,
    encodeRow,
    type LocalColumn,
    type LocalRow,
    type LocalTable,
    type WireObject,
} from '@navis/shared';
import { DataSource, type EntityMetadata } from 'typeorm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { dataSourceOptions } from './data-source';

/**
 * Viaje de ida y vuelta (Fase 2 de sincronización): una fila con la forma del
 * protocolo se decodifica, la guarda **TypeORM de verdad** (entidad completa),
 * se lee en crudo de SQLite y, al volver a codificarla, sale igual. Demuestra
 * que ninguna columna se pierde ni cambia de significado al pasar por la API
 * (booleanos, JSON, días, horas e instantes).
 */
function sample(table: string, column: LocalColumn): string | number {
    switch (columnKind(table, column.name)) {
        case 'instant':
            return '2026-03-14T10:30:00.000Z';
        case 'day':
            return '2026-03-14';
        case 'time':
            return '19:30:00';
        case 'json':
            return '{"a":[1,2]}';
        default:
            if (column.type === 'bool') return 1;
            if (column.type === 'int' || column.type === 'real') return 7;
            // Los uuid de la API son `varchar`: cualquier texto vale en SQLite.
            return `${column.name}-valor`;
    }
}

/** El valor que el entity espera en memoria: `Date` para instantes, objeto para JSON. */
function toEntityValue(table: string, column: LocalColumn, value: string | number | null) {
    if (value === null) return null;
    const kind = columnKind(table, column.name);
    if (kind === 'instant') return new Date(String(value));
    if (kind === 'json') return JSON.parse(String(value)) as unknown;
    if (column.type === 'bool') return value === 1;
    return value;
}

function buildEntity(metadata: EntityMetadata, table: LocalTable, row: LocalRow) {
    const entity: Record<string, unknown> = {};
    for (const column of table.columns) {
        const target = metadata.columns.find((one) => one.databaseName === column.name);
        if (!target) throw new Error(`${table.name}.${column.name} no existe en la entidad`);
        entity[target.propertyName] = toEntityValue(table.name, column, row[column.name] ?? null);
    }
    return entity;
}

let dataSource: DataSource;

beforeAll(async () => {
    dataSource = new DataSource({
        type: 'better-sqlite3',
        database: ':memory:',
        entities: dataSourceOptions.entities as never[],
        synchronize: true,
    });
    await dataSource.initialize();
    // Cada tabla se prueba aislada: sus claves foráneas apuntan a filas que no existen.
    await dataSource.query('PRAGMA foreign_keys = OFF');
});

afterAll(async () => {
    await dataSource.destroy();
});

describe.each(ALL_LOCAL_TABLES.filter((table) => table.mirror))(
    'ida y vuelta por TypeORM: $name',
    (table: LocalTable) => {
        it('guarda y recupera la fila sin perder ni cambiar ninguna columna', async () => {
            const metadata = dataSource.entityMetadatas.find((one) => one.tableName === table.name);
            if (!metadata) throw new Error(`Sin entidad para ${table.name}`);

            const row: LocalRow = {};
            for (const column of table.columns) row[column.name] = sample(table.name, column);
            row.deleted_at = null;
            const wire: WireObject = encodeRow(table, row);

            const entity = buildEntity(metadata, table, decodeRow(table, wire));
            // `insert` no pasa por los hooks de fechas automáticas: lo guardado es lo enviado.
            await dataSource.getRepository(metadata.target).insert(entity);

            const stored = await dataSource.query<Record<string, string | number | null>[]>(
                `SELECT * FROM "${table.name}"`,
            );
            expect(stored).toHaveLength(1);
            expect(encodeRow(table, stored[0] as LocalRow)).toEqual(wire);
        });
    },
);
