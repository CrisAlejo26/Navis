import type { LocalRow } from '@navis/shared';

import type { LocalDb } from '@/data/local-db';

import { keyWhere, localTable } from './wire-row';

export async function readLocalRow(
    db: LocalDb,
    table: string,
    entityId: string,
): Promise<LocalRow | null> {
    const where = keyWhere(table, entityId);
    return db.getFirstAsync<LocalRow>(
        `SELECT * FROM "${table}" WHERE ${where.sql}`,
        ...where.params,
    );
}

/** Guarda una fila completa: actualiza si existe y, si no, la inserta. Sin tocar el registro de cambios (quien llama decide). */
export async function writeLocalRow(
    db: LocalDb,
    table: string,
    entityId: string,
    row: LocalRow,
): Promise<void> {
    const names = localTable(table).columns.map((column) => column.name);
    const values = names.map((name) => row[name] ?? null);
    const where = keyWhere(table, entityId);
    const updated = await db.runAsync(
        `UPDATE "${table}" SET ${names.map((name) => `"${name}" = ?`).join(', ')} WHERE ${where.sql}`,
        ...values,
        ...where.params,
    );
    if (updated.changes === 0) {
        await db.runAsync(
            `INSERT INTO "${table}" (${names.map((name) => `"${name}"`).join(', ')}) VALUES (${names.map(() => '?').join(', ')})`,
            ...values,
        );
    }
}

/** Borra una entidad: lógico si la tabla tiene `deleted_at`, físico si no. */
export async function deleteLocalRow(
    db: LocalDb,
    table: string,
    entityId: string,
    now: string,
): Promise<void> {
    const where = keyWhere(table, entityId);
    if (localTable(table).columns.some((column) => column.name === 'deleted_at')) {
        await db.runAsync(
            `UPDATE "${table}" SET deleted_at = COALESCE(deleted_at, ?) WHERE ${where.sql}`,
            now,
            ...where.params,
        );
    } else {
        await db.runAsync(`DELETE FROM "${table}" WHERE ${where.sql}`, ...where.params);
    }
}
