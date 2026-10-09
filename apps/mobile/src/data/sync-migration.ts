import { localTriggerStatements } from '@navis/shared';

import type { LocalDb } from './local-db';

/**
 * Metadatos de sincronización del teléfono (Fase 5). Son **del aparato**: no
 * están en `ALL_LOCAL_TABLES` ni espejan ninguna entidad de la API, y por eso la
 * paridad con TypeORM y las copias de seguridad no los tocan.
 *
 * - `sync_state`: una fila. A qué destino está vinculado el teléfono, si hay que
 *   registrar cambios (`capturing`) y si se está aplicando una descarga
 *   (`applying`, que apaga el registro para que lo bajado no vuelva a subir).
 * - `sync_outbox`: lo que falta por enviar. Una entrada pendiente por entidad y
 *   destino; las ediciones seguidas se funden. `destination` impide que la cola de
 *   una instalación se envíe a otra.
 * - `sync_entity_state`: la última revisión del servidor que este teléfono conoce
 *   de cada entidad. Es la «revisión base» de la siguiente edición.
 * - `sync_checkpoint`: hasta dónde se ha descargado de cada destino.
 * - `sync_conflicts`: lo que el servidor no pudo aplicar y espera decisión (Fase 6).
 */
export const SYNC_DDL: readonly string[] = [
    `CREATE TABLE IF NOT EXISTS sync_state (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        destination TEXT,
        capturing INTEGER NOT NULL DEFAULT 0,
        applying INTEGER NOT NULL DEFAULT 0
    )`,
    `INSERT OR IGNORE INTO sync_state (id, destination, capturing, applying) VALUES (1, NULL, 0, 0)`,
    `CREATE TABLE IF NOT EXISTS sync_outbox (
        seq INTEGER PRIMARY KEY AUTOINCREMENT,
        destination TEXT,
        table_name TEXT NOT NULL,
        entity_id TEXT NOT NULL,
        op TEXT NOT NULL,
        state TEXT NOT NULL DEFAULT 'pending',
        operation_id TEXT,
        attempts INTEGER NOT NULL DEFAULT 0,
        last_error TEXT,
        queued_at TEXT NOT NULL
    )`,
    `CREATE UNIQUE INDEX IF NOT EXISTS UQ_sync_outbox_pending
        ON sync_outbox (destination, table_name, entity_id) WHERE state = 'pending'`,
    `CREATE INDEX IF NOT EXISTS IDX_sync_outbox_state ON sync_outbox (destination, state, seq)`,
    `CREATE TABLE IF NOT EXISTS sync_entity_state (
        destination TEXT NOT NULL,
        table_name TEXT NOT NULL,
        entity_id TEXT NOT NULL,
        revision INTEGER NOT NULL,
        PRIMARY KEY (destination, table_name, entity_id)
    )`,
    `CREATE TABLE IF NOT EXISTS sync_checkpoint (
        destination TEXT PRIMARY KEY,
        generation TEXT,
        cursor INTEGER NOT NULL DEFAULT 0
    )`,
    `CREATE TABLE IF NOT EXISTS sync_conflicts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        destination TEXT NOT NULL,
        table_name TEXT NOT NULL,
        entity_id TEXT NOT NULL,
        reason TEXT NOT NULL,
        remote_revision INTEGER,
        created_at TEXT NOT NULL,
        resolved_at TEXT
    )`,
];

/** Instala (o reinstala, es idempotente) los triggers de cola sobre las tablas sincronizadas. */
export async function installOutboxTriggers(db: LocalDb): Promise<void> {
    for (const statement of localTriggerStatements()) await db.execAsync(statement);
}

export async function migrateSync(db: LocalDb): Promise<void> {
    for (const statement of SYNC_DDL) await db.execAsync(statement);
    await installOutboxTriggers(db);
}

/**
 * Fase 6. La versión base de cada entidad (para comparar a tres bandas), los
 * datos de cada conflicto, los cambios del servidor que esperan a una edición
 * local sin enviar y los alias de las fusiones. Se añaden columnas con ALTER:
 * estas tablas no tienen triggers.
 *
 * - `base_json`: la fila tal y como la confirmó el servidor por última vez. Sin
 *   las contraseñas de las tablas: la base solo sirve para comparar y no debe
 *   guardar nada que el aparato cifra.
 * - `sync_remote_pending`: lo último que llegó del servidor sobre una entidad con
 *   edición local sin enviar. Va en la forma de SQLite (con las contraseñas ya
 *   selladas con la clave del aparato).
 * - `sync_aliases`: «este id es ahora aquel»: tras fusionar dos registros, lo que
 *   llegue del servidor con el id retirado se redirige al conservado.
 */
const NEW_COLUMNS: readonly [string, string, string][] = [
    ['sync_entity_state', 'base_json', 'TEXT'],
    ['sync_conflicts', 'kind', "TEXT NOT NULL DEFAULT 'fields'"],
    ['sync_conflicts', 'base_json', 'TEXT'],
    ['sync_conflicts', 'local_json', 'TEXT'],
    ['sync_conflicts', 'remote_json', 'TEXT'],
    ['sync_conflicts', 'fields_json', 'TEXT'],
];

export const SYNC_CONFLICT_DDL: readonly string[] = [
    `CREATE TABLE IF NOT EXISTS sync_remote_pending (
        destination TEXT NOT NULL,
        table_name TEXT NOT NULL,
        entity_id TEXT NOT NULL,
        revision INTEGER NOT NULL,
        op TEXT NOT NULL,
        row_json TEXT,
        PRIMARY KEY (destination, table_name, entity_id)
    )`,
    `CREATE TABLE IF NOT EXISTS sync_aliases (
        table_name TEXT NOT NULL,
        alias_id TEXT NOT NULL,
        canonical_id TEXT NOT NULL,
        created_at TEXT NOT NULL,
        PRIMARY KEY (table_name, alias_id)
    )`,
];

/** Idempotente: una migración que se reejecuta (reinicio de pruebas, base reparada) no falla por una columna que ya está. */
export async function migrateSyncConflicts(db: LocalDb): Promise<void> {
    for (const [table, column, definition] of NEW_COLUMNS) {
        const existing = await db.getAllAsync<{ name: string }>(`PRAGMA table_info(${table})`);
        if (existing.some((one) => one.name === column)) continue;
        await db.execAsync(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
    }
    for (const statement of SYNC_CONFLICT_DDL) await db.execAsync(statement);
}
