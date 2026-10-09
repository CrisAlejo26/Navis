import type { LocalRow } from '@navis/shared';

import type { LocalDb } from '@/data/local-db';

/**
 * Persistencia de lo que la Fase 6 necesita recordar: la versión base de cada
 * entidad, lo último que llegó del servidor mientras había una edición local sin
 * enviar, y los conflictos abiertos con sus tres versiones.
 */

const parse = (json: string | null): LocalRow | null =>
    json === null ? null : (JSON.parse(json) as LocalRow);

export async function readBase(
    db: LocalDb,
    destination: string,
    table: string,
    entityId: string,
): Promise<LocalRow | null> {
    const row = await db.getFirstAsync<{ base_json: string | null }>(
        'SELECT base_json FROM sync_entity_state WHERE destination = ? AND table_name = ? AND entity_id = ?',
        destination,
        table,
        entityId,
    );
    return parse(row?.base_json ?? null);
}

/** Fija la revisión conocida y su versión base (sin contraseñas). `null` borra la base. */
export async function writeBase(
    db: LocalDb,
    destination: string,
    table: string,
    entityId: string,
    revision: number,
    base: LocalRow | null,
): Promise<void> {
    await db.runAsync(
        `INSERT INTO sync_entity_state (destination, table_name, entity_id, revision, base_json) VALUES (?, ?, ?, ?, ?)
         ON CONFLICT (destination, table_name, entity_id)
         DO UPDATE SET revision = MAX(revision, excluded.revision), base_json = excluded.base_json`,
        destination,
        table,
        entityId,
        revision,
        base === null ? null : JSON.stringify(base),
    );
}

export interface RemotePending {
    revision: number;
    op: 'upsert' | 'delete';
    /** Ya en la forma de SQLite, con las contraseñas selladas con la clave del aparato. */
    row: LocalRow | null;
}

/** Guarda lo último del servidor sobre una entidad que no se puede tocar todavía. Conserva la revisión más alta. */
export async function saveRemotePending(
    db: LocalDb,
    destination: string,
    table: string,
    entityId: string,
    pending: RemotePending,
): Promise<void> {
    await db.runAsync(
        `INSERT INTO sync_remote_pending (destination, table_name, entity_id, revision, op, row_json) VALUES (?, ?, ?, ?, ?, ?)
         ON CONFLICT (destination, table_name, entity_id) DO UPDATE SET
            revision = excluded.revision, op = excluded.op, row_json = excluded.row_json
         WHERE excluded.revision >= sync_remote_pending.revision`,
        destination,
        table,
        entityId,
        pending.revision,
        pending.op,
        pending.row === null ? null : JSON.stringify(pending.row),
    );
}

export async function loadRemotePending(
    db: LocalDb,
    destination: string,
    table: string,
    entityId: string,
): Promise<RemotePending | null> {
    const row = await db.getFirstAsync<{
        revision: number;
        op: 'upsert' | 'delete';
        row_json: string | null;
    }>(
        'SELECT revision, op, row_json FROM sync_remote_pending WHERE destination = ? AND table_name = ? AND entity_id = ?',
        destination,
        table,
        entityId,
    );
    return row ? { revision: row.revision, op: row.op, row: parse(row.row_json) } : null;
}

export async function listRemotePending(
    db: LocalDb,
    destination: string,
): Promise<{ table_name: string; entity_id: string }[]> {
    return db.getAllAsync(
        'SELECT table_name, entity_id FROM sync_remote_pending WHERE destination = ?',
        destination,
    );
}

export async function clearRemotePending(
    db: LocalDb,
    destination: string,
    table: string,
    entityId: string,
): Promise<void> {
    await db.runAsync(
        'DELETE FROM sync_remote_pending WHERE destination = ? AND table_name = ? AND entity_id = ?',
        destination,
        table,
        entityId,
    );
}

export type ConflictKind = 'fields' | 'remote-deleted' | 'local-deleted';

export interface ConflictRecord {
    id: number;
    table_name: string;
    entity_id: string;
    kind: ConflictKind;
    reason: string;
    remote_revision: number | null;
    base_json: string | null;
    local_json: string | null;
    remote_json: string | null;
    fields_json: string | null;
    created_at: string;
}

export interface OpenConflict {
    table: string;
    entityId: string;
    kind: ConflictKind;
    reason: string;
    remoteRevision: number | null;
    base: LocalRow | null;
    local: LocalRow | null;
    remote: LocalRow | null;
    fields: string[];
    now: string;
}

/** Abre un conflicto o, si la entidad ya tenía uno abierto, lo completa (un solo conflicto abierto por entidad). */
export async function openConflict(
    db: LocalDb,
    destination: string,
    conflict: OpenConflict,
): Promise<void> {
    const values = [
        conflict.kind,
        conflict.reason,
        conflict.remoteRevision,
        conflict.base ? JSON.stringify(conflict.base) : null,
        conflict.local ? JSON.stringify(conflict.local) : null,
        conflict.remote ? JSON.stringify(conflict.remote) : null,
        JSON.stringify(conflict.fields),
    ];
    const existing = await db.getFirstAsync<{ id: number }>(
        'SELECT id FROM sync_conflicts WHERE destination = ? AND table_name = ? AND entity_id = ? AND resolved_at IS NULL',
        destination,
        conflict.table,
        conflict.entityId,
    );
    if (existing) {
        await db.runAsync(
            `UPDATE sync_conflicts SET kind = ?, reason = ?, remote_revision = ?, base_json = ?, local_json = ?,
             remote_json = ?, fields_json = ? WHERE id = ?`,
            ...values,
            existing.id,
        );
        return;
    }
    await db.runAsync(
        `INSERT INTO sync_conflicts (destination, table_name, entity_id, kind, reason, remote_revision,
         base_json, local_json, remote_json, fields_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        destination,
        conflict.table,
        conflict.entityId,
        ...values,
        conflict.now,
    );
}

/** Anota que el servidor rechazó una operación por base vieja, sin pisar un conflicto que ya tenga datos. */
export async function ensureConflict(
    db: LocalDb,
    destination: string,
    table: string,
    entityId: string,
    reason: string,
    remoteRevision: number | null,
    now: string,
): Promise<void> {
    const existing = await db.getFirstAsync<{ id: number }>(
        'SELECT id FROM sync_conflicts WHERE destination = ? AND table_name = ? AND entity_id = ? AND resolved_at IS NULL',
        destination,
        table,
        entityId,
    );
    if (existing) return;
    await db.runAsync(
        'INSERT INTO sync_conflicts (destination, table_name, entity_id, reason, remote_revision, created_at) VALUES (?, ?, ?, ?, ?, ?)',
        destination,
        table,
        entityId,
        reason,
        remoteRevision,
        now,
    );
}

export function listOpenConflicts(db: LocalDb, destination: string): Promise<ConflictRecord[]> {
    return db.getAllAsync<ConflictRecord>(
        `SELECT id, table_name, entity_id, kind, reason, remote_revision, base_json, local_json, remote_json,
                fields_json, created_at
         FROM sync_conflicts WHERE destination = ? AND resolved_at IS NULL ORDER BY id`,
        destination,
    );
}

export function getConflict(
    db: LocalDb,
    destination: string,
    id: number,
): Promise<ConflictRecord | null> {
    return db.getFirstAsync<ConflictRecord>(
        `SELECT id, table_name, entity_id, kind, reason, remote_revision, base_json, local_json, remote_json,
                fields_json, created_at
         FROM sync_conflicts WHERE destination = ? AND id = ? AND resolved_at IS NULL`,
        destination,
        id,
    );
}

/** Cierra los conflictos abiertos de una entidad (resueltos por fusión automática o por decisión). */
export async function closeConflicts(
    db: LocalDb,
    destination: string,
    table: string,
    entityId: string,
    now: string,
): Promise<void> {
    await db.runAsync(
        'UPDATE sync_conflicts SET resolved_at = ? WHERE destination = ? AND table_name = ? AND entity_id = ? AND resolved_at IS NULL',
        now,
        destination,
        table,
        entityId,
    );
}
