import type { LocalDb } from '@/data/local-db';
import { newId } from '@/data/local-db';

import { ensureConflict, writeBase } from './conflicts-store';
import type { LocalRow } from '@navis/shared';

export interface OutboxRow {
    seq: number;
    table_name: string;
    entity_id: string;
    op: 'upsert' | 'delete';
    state: 'pending' | 'sending' | 'conflict' | 'rejected';
    operation_id: string | null;
    attempts: number;
    last_error: string | null;
}

export interface OutboxCounts {
    pending: number;
    conflicts: number;
    rejected: number;
}

/** Cuánto hay por enviar y cuánto espera una decisión, de este destino. */
export async function outboxCounts(db: LocalDb, destination: string): Promise<OutboxCounts> {
    const rows = await db.getAllAsync<{ state: string; total: number }>(
        'SELECT state, COUNT(*) AS total FROM sync_outbox WHERE destination = ? GROUP BY state',
        destination,
    );
    const count = (...states: string[]): number =>
        rows.filter((row) => states.includes(row.state)).reduce((sum, row) => sum + row.total, 0);
    return {
        pending: count('pending', 'sending'),
        conflicts: count('conflict'),
        rejected: count('rejected'),
    };
}

/**
 * La siguiente tanda a enviar. Lo que quedó `sending` (la app se cerró antes de
 * recibir la respuesta) va primero y **con su mismo `operation_id`**: el servidor
 * lo reconoce y devuelve el resultado de la primera vez, sin duplicar nada.
 *
 * Una entidad solo aparece una vez por tanda: su segunda edición espera a que la
 * primera se confirme, porque su revisión base es el resultado de la anterior
 * (encadenadas, no enviadas contra la misma revisión vieja).
 */
export async function takeBatch(
    db: LocalDb,
    destination: string,
    limit: number,
    skipTables: ReadonlySet<string> = new Set(),
): Promise<OutboxRow[]> {
    const candidates = await db.getAllAsync<OutboxRow>(
        `SELECT * FROM sync_outbox
         WHERE destination = ? AND state IN ('pending', 'sending')
         ORDER BY CASE state WHEN 'sending' THEN 0 ELSE 1 END, seq`,
        destination,
    );
    const seen = new Set<string>();
    const batch: OutboxRow[] = [];
    for (const row of candidates) {
        if (skipTables.has(row.table_name)) continue;
        const entity = `${row.table_name}|${row.entity_id}`;
        if (seen.has(entity)) continue;
        seen.add(entity);
        if (batch.length < limit) batch.push(row);
    }

    for (const row of batch) {
        if (row.state === 'sending') continue;
        // Se guarda ANTES de la petición: un reintento tras un corte reutiliza el identificador.
        const operationId = newId();
        await db.runAsync(
            "UPDATE sync_outbox SET state = 'sending', operation_id = ?, attempts = attempts + 1 WHERE seq = ?",
            operationId,
            row.seq,
        );
        row.state = 'sending';
        row.operation_id = operationId;
    }
    return batch;
}

export async function revisionOf(
    db: LocalDb,
    destination: string,
    table: string,
    entityId: string,
): Promise<number> {
    const row = await db.getFirstAsync<{ revision: number }>(
        'SELECT revision FROM sync_entity_state WHERE destination = ? AND table_name = ? AND entity_id = ?',
        destination,
        table,
        entityId,
    );
    return row?.revision ?? 0;
}

export async function rememberRevision(
    db: LocalDb,
    destination: string,
    table: string,
    entityId: string,
    revision: number,
): Promise<void> {
    await db.runAsync(
        `INSERT INTO sync_entity_state (destination, table_name, entity_id, revision) VALUES (?, ?, ?, ?)
         ON CONFLICT (destination, table_name, entity_id) DO UPDATE SET revision = MAX(revision, excluded.revision)`,
        destination,
        table,
        entityId,
        revision,
    );
}

/** La entrada se confirmó: sale de la cola y la entidad recuerda su nueva revisión. */
export async function markDone(
    db: LocalDb,
    destination: string,
    row: OutboxRow,
    revision: number | undefined,
    base: LocalRow | null = null,
): Promise<void> {
    await db.runAsync('DELETE FROM sync_outbox WHERE seq = ?', row.seq);
    if (revision !== undefined) {
        await writeBase(db, destination, row.table_name, row.entity_id, revision, base);
    }
}

/** El servidor no pudo aplicarla sobre lo que hay: queda apartada y anotada, sin perder la edición local. */
export async function markConflict(
    db: LocalDb,
    destination: string,
    row: OutboxRow,
    reason: string,
    remoteRevision: number | undefined,
    now: string,
): Promise<void> {
    await db.runAsync(
        "UPDATE sync_outbox SET state = 'conflict', last_error = ? WHERE seq = ?",
        reason,
        row.seq,
    );
    await ensureConflict(
        db,
        destination,
        row.table_name,
        row.entity_id,
        reason,
        remoteRevision ?? null,
        now,
    );
}

/** Rechazada por el servidor (permiso, validación…): no se reintenta sola. */
export async function markRejected(db: LocalDb, row: OutboxRow, reason: string): Promise<void> {
    await db.runAsync(
        "UPDATE sync_outbox SET state = 'rejected', last_error = ? WHERE seq = ?",
        reason,
        row.seq,
    );
}

/** Vuelve a pendiente (el servidor aún no sabe aplicarla, o falló la red): se reintentará más tarde. */
export async function releaseForRetry(db: LocalDb, row: OutboxRow, reason: string): Promise<void> {
    await db.runAsync(
        "UPDATE sync_outbox SET state = 'pending', operation_id = NULL, last_error = ? WHERE seq = ? AND state = 'sending'",
        reason,
        row.seq,
    );
}

/** Si la entidad tiene algo sin confirmar: una descarga no debe pisarlo. */
export async function hasUnsent(
    db: LocalDb,
    destination: string,
    table: string,
    entityId: string,
): Promise<boolean> {
    const row = await db.getFirstAsync<{ total: number }>(
        `SELECT COUNT(*) AS total FROM sync_outbox
         WHERE destination = ? AND table_name = ? AND entity_id = ? AND state IN ('pending', 'sending', 'conflict')`,
        destination,
        table,
        entityId,
    );
    return (row?.total ?? 0) > 0;
}

/**
 * Devuelve una entidad a la cola tras resolver su conflicto: sale de `conflict` y
 * queda una sola entrada pendiente con la operación indicada.
 */
export async function reopenEntry(
    db: LocalDb,
    destination: string,
    table: string,
    entityId: string,
    op: 'upsert' | 'delete',
    now: string,
): Promise<void> {
    await db.runAsync(
        "DELETE FROM sync_outbox WHERE destination = ? AND table_name = ? AND entity_id = ? AND state = 'conflict'",
        destination,
        table,
        entityId,
    );
    const pending = await db.getFirstAsync<{ seq: number }>(
        "SELECT seq FROM sync_outbox WHERE destination = ? AND table_name = ? AND entity_id = ? AND state = 'pending'",
        destination,
        table,
        entityId,
    );
    if (pending) {
        await db.runAsync('UPDATE sync_outbox SET op = ? WHERE seq = ?', op, pending.seq);
        return;
    }
    await db.runAsync(
        "INSERT INTO sync_outbox (destination, table_name, entity_id, op, state, queued_at) VALUES (?, ?, ?, ?, 'pending', ?)",
        destination,
        table,
        entityId,
        op,
        now,
    );
}

/** Quita de la cola lo que ya no hay que enviar (la persona eligió lo del servidor). */
export async function dropEntries(
    db: LocalDb,
    destination: string,
    table: string,
    entityId: string,
): Promise<void> {
    await db.runAsync(
        "DELETE FROM sync_outbox WHERE destination = ? AND table_name = ? AND entity_id = ? AND state IN ('pending', 'conflict')",
        destination,
        table,
        entityId,
    );
}
