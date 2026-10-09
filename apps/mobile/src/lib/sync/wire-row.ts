import {
    ALL_LOCAL_TABLES,
    cellsFromWire,
    cellsToWire,
    decodeRow,
    encodeRow,
    entityKeyColumns,
    splitEntityId,
    type LocalRow,
    type LocalTable,
    type WireObject,
} from '@navis/shared';

import type { LocalDb } from '@/data/local-db';
import { decryptCell, encryptCell } from '@/lib/tables/crypto';

export function localTable(name: string): LocalTable {
    const table = ALL_LOCAL_TABLES.find((one) => one.name === name);
    if (!table) throw new Error(`Tabla local desconocida: ${name}`);
    return table;
}

/** `WHERE` de una entidad: su `id`, o las dos columnas de una clave compuesta. */
export function keyWhere(table: string, entityId: string): { sql: string; params: string[] } {
    const key = splitEntityId(table, entityId);
    const columns = entityKeyColumns(table);
    return {
        sql: columns.map((column) => `"${column}" = ?`).join(' AND '),
        params: columns.map((column) => key[column] ?? ''),
    };
}

function parseData(text: unknown): Record<string, unknown> | null {
    if (typeof text !== 'string') return null;
    try {
        const parsed: unknown = JSON.parse(text);
        return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)
            ? (parsed as Record<string, unknown>)
            : null;
    } catch {
        return null;
    }
}

/**
 * La fila local tal y como la entiende el protocolo, o `null` si ya no existe.
 * Las contraseñas de una tabla personalizada salen **en claro**: el sobre está
 * cifrado con la clave de este aparato y la web no podría leerlo (Fase 3).
 */
export async function readLocalWireRow(
    db: LocalDb,
    table: string,
    entityId: string,
): Promise<WireObject | null> {
    const definition = localTable(table);
    const where = keyWhere(table, entityId);
    const row = await db.getFirstAsync<LocalRow>(
        `SELECT * FROM "${table}" WHERE ${where.sql}`,
        ...where.params,
    );
    if (!row) return null;

    if (table === 'custom_table_rows') {
        const data = parseData(row.data);
        if (data) {
            const plain = await cellsToWire(data, (envelope) => decryptCell(envelope));
            row.data = JSON.stringify(plain);
        }
    }
    return encodeRow(definition, row);
}

async function passwordKeys(db: LocalDb, tableId: string): Promise<string[]> {
    const columns = await db.getAllAsync<{ key: string }>(
        "SELECT key FROM custom_table_columns WHERE table_id = ? AND type = 'password'",
        tableId,
    );
    return columns.map((column) => column.key);
}

/** Lo contrario: una fila del protocolo lista para guardarse en SQLite (contraseñas selladas con la clave del aparato). */
export async function toLocalRow(
    db: LocalDb,
    table: string,
    wire: Readonly<Record<string, unknown>>,
): Promise<LocalRow> {
    const row = decodeRow(localTable(table), wire);
    if (table === 'custom_table_rows') {
        const data = parseData(row.data);
        if (data && typeof row.table_id === 'string') {
            const sealed = await cellsFromWire(
                data,
                await passwordKeys(db, row.table_id),
                (plain) => encryptCell(plain),
            );
            row.data = JSON.stringify(sealed);
        }
    }
    return row;
}
