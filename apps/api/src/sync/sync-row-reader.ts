import {
    ALL_LOCAL_TABLES,
    columnKind,
    encodeRow,
    type LocalColumn,
    type LocalRow,
    type WireObject,
} from '@navis/shared';
import type { DataSource } from 'typeorm';

import { toIsoDay } from '../database/iso-day';

/**
 * Lee una fila en crudo y la deja con la forma que espera `encodeRow` (la misma
 * que el SQLite del móvil). Postgres devuelve `Date` en las columnas de fecha y
 * de instante y `true/false` en las booleanas; SQLite ya devuelve texto y 0/1.
 */
function toLocalValue(table: string, column: LocalColumn, value: unknown): string | number | null {
    if (value === null || value === undefined) return null;
    if (column.type === 'bool') return value === true || value === 1 || value === '1' ? 1 : 0;
    const kind = columnKind(table, column.name);
    if (value instanceof Date) {
        return kind === 'day' ? toIsoDay(value) : value.toISOString();
    }
    if (kind === 'json' && typeof value === 'object') return JSON.stringify(value);
    if (typeof value === 'string' || typeof value === 'number') return value;
    throw new Error(`${table}.${column.name}: valor no representable`);
}

/** El estado actual de una fila con la forma del protocolo, o `null` si ya no existe. */
export async function readWireRow(
    dataSource: DataSource,
    table: string,
    id: string,
): Promise<WireObject | null> {
    const definition = ALL_LOCAL_TABLES.find((one) => one.name === table);
    if (!definition) throw new Error(`Tabla sin esquema local: ${table}`);

    const found: unknown = await dataSource.query(
        `SELECT * FROM "${table}" WHERE id = ${dataSource.options.type === 'postgres' ? '$1' : '?'}`,
        [id],
    );
    const raw = Array.isArray(found)
        ? (found[0] as Record<string, unknown> | undefined)
        : undefined;
    if (!raw) return null;

    const row: LocalRow = {};
    for (const column of definition.columns) {
        row[column.name] = toLocalValue(table, column, raw[column.name]);
    }
    return encodeRow(definition, row);
}
