import type { SyncOperation } from '@navis/shared';

import type { LocalDb } from '@/data/local-db';

import {
    markConflict,
    markDone,
    markRejected,
    releaseForRetry,
    revisionOf,
    takeBatch,
    type OutboxRow,
} from './outbox';
import type { SyncApi } from './sync-api';
import { baseFromWire } from './secret-cells';
import { readLocalWireRow } from './wire-row';

const BATCH = 50;

export interface PushReport {
    sent: number;
    conflicts: number;
    rejected: number;
}

/**
 * Convierte una entrada de la cola en la operación que se envía, leyendo la fila
 * **tal y como está ahora**. `null` si no hay nada que enviar: se borró algo que
 * el servidor nunca llegó a conocer.
 */
async function toOperation(
    db: LocalDb,
    destination: string,
    row: OutboxRow,
): Promise<SyncOperation | null> {
    const baseRevision = await revisionOf(db, destination, row.table_name, row.entity_id);
    const fields =
        row.op === 'upsert' ? await readLocalWireRow(db, row.table_name, row.entity_id) : null;

    // La fila se borró del todo después de apuntarse: para el servidor es un borrado.
    const op = fields ? 'upsert' : 'delete';
    if (op === 'delete' && baseRevision === 0) return null;

    return {
        operationId: row.operation_id ?? '',
        table: row.table_name,
        id: row.entity_id,
        op,
        baseRevision,
        ...(fields ? { fields } : {}),
    };
}

/**
 * Envía la cola por tandas hasta vaciarla (o hasta que el servidor rechace una
 * tabla entera). Cada resultado se guarda al recibirlo: si la app se cierra a
 * mitad, lo confirmado ya salió de la cola y lo demás se reenvía con el mismo
 * identificador, que el servidor reconoce.
 */
export async function pushOutbox(
    db: LocalDb,
    api: SyncApi,
    destination: string,
    now: () => string,
): Promise<PushReport> {
    const report: PushReport = { sent: 0, conflicts: 0, rejected: 0 };
    const blocked = new Set<string>();

    for (;;) {
        const batch = await takeBatch(db, destination, BATCH, blocked);
        if (batch.length === 0) return report;

        const operations: SyncOperation[] = [];
        const sendable: OutboxRow[] = [];
        for (const row of batch) {
            const operation = await toOperation(db, destination, row);
            if (operation) {
                operations.push(operation);
                sendable.push(row);
            } else {
                await markDone(db, destination, row, undefined);
            }
        }
        if (operations.length === 0) continue;

        // Si esto lanza (sin red), las entradas siguen `sending` con su identificador.
        const results = await api.operations(operations);
        const sentFields = new Map(operations.map((op) => [op.operationId, op.fields]));
        const byOperation = new Map(results.map((result) => [result.operationId, result]));

        for (const row of sendable) {
            const result = byOperation.get(row.operation_id ?? '');
            if (!result) continue; // sin respuesta para esta: sigue `sending` y se reenvía
            if (result.status === 'applied' || result.status === 'duplicate') {
                const fields = sentFields.get(row.operation_id ?? '');
                const base = fields ? await baseFromWire(db, row.table_name, fields) : null;
                await markDone(db, destination, row, result.revision, base);
                report.sent += 1;
            } else if (result.status === 'conflict') {
                await markConflict(
                    db,
                    destination,
                    row,
                    result.reason ?? 'conflict',
                    result.revision,
                    now(),
                );
                report.conflicts += 1;
            } else if (result.reason === 'unsupported-table') {
                // El servidor aún no sabe aplicar esta tabla: se queda en cola para cuando sepa.
                await releaseForRetry(db, row, 'unsupported-table');
                blocked.add(row.table_name);
            } else {
                await markRejected(db, row, result.reason ?? 'rejected');
                report.rejected += 1;
            }
        }
    }
}
