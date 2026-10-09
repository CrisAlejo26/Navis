import {
    ALL_LOCAL_TABLES,
    columnKind,
    encodeRow,
    splitEntityId,
    type LocalColumn,
    type LocalRow,
    type WireObject,
} from '@navis/shared';
import type { DataSource } from 'typeorm';

import { toIsoDay } from '../database/iso-day';
import { revealRowData } from './sync-password-cells';

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

    // El identificador puede ser un par (list_members, list_grants): una condición por columna.
    const key = splitEntityId(table, id);
    const marker = (index: number): string =>
        dataSource.options.type === 'postgres' ? `$${String(index + 1)}` : '?';
    const where = Object.keys(key)
        .map((column, index) => `"${column}" = ${marker(index)}`)
        .join(' AND ');
    const found: unknown = await dataSource.query(
        `SELECT * FROM "${table}" WHERE ${where}`,
        Object.values(key),
    );
    const raw = Array.isArray(found)
        ? (found[0] as Record<string, unknown> | undefined)
        : undefined;
    if (!raw) return null;

    const row: LocalRow = {};
    for (const column of definition.columns) {
        row[column.name] = toLocalValue(table, column, raw[column.name]);
    }
    // Las contraseñas de las tablas viajan en claro por el canal autorizado (ver sync-password-cells).
    if (
        table === 'custom_table_rows' &&
        typeof row.data === 'string' &&
        typeof row.table_id === 'string'
    ) {
        row.data = await revealRowData(dataSource, row.table_id, row.data);
    }
    return encodeRow(definition, row);
}
