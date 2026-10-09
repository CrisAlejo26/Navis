import type { LocalRow } from '@navis/shared';

import type { LocalDb } from '@/data/local-db';
import { inLocalTransaction } from '@/data/local-transaction';

import { withoutCapture } from './capture';
import {
    clearRemotePending,
    closeConflicts,
    listRemotePending,
    loadRemotePending,
    openConflict,
    readBase,
    writeBase,
    type ConflictKind,
    type RemotePending,
} from './conflicts-store';
import { deleteLocalRow, readLocalRow, writeLocalRow } from './local-row';
import { dropEntries, reopenEntry } from './outbox';
import { mergeRows } from './merge-row';
import { scrubRow, sealRow } from './secret-cells';

export type ReconcileOutcome =
    | 'none'
    /** Los cambios eran compatibles: se fusionaron solos y la fusión espera para subir. */
    | 'merged'
    /** Hay un choque (o un borrado contra una edición) y decide una persona. */
    | 'needs-decision'
    /** Los dos lados lo borraron: queda borrado, sin conflicto. */
    | 'both-deleted'
    /** Ya no había nada local sin enviar: se aplicó lo del servidor. */
    | 'remote-applied';

const isDeleted = (row: LocalRow | null): boolean => row === null || row.deleted_at != null;

/** Aplica lo que el servidor tenía guardado en espera, como si hubiera llegado ahora. */
export async function applyRemote(
    db: LocalDb,
    destination: string,
    table: string,
    entityId: string,
    remote: RemotePending,
    now: string,
): Promise<void> {
    await withoutCapture(db, async () => {
        if (remote.row === null) await deleteLocalRow(db, table, entityId, now);
        else await writeLocalRow(db, table, entityId, remote.row);
    });
    const base = remote.row === null ? null : await scrubRow(db, table, remote.row);
    await writeBase(db, destination, table, entityId, remote.revision, base);
    await clearRemotePending(db, destination, table, entityId);
    await closeConflicts(db, destination, table, entityId, now);
}

/** Aparta la entrada de la cola mientras espera una decisión: no se envía a ciegas. */
async function holdEntries(db: LocalDb, destination: string, table: string, id: string) {
    await db.runAsync(
        "UPDATE sync_outbox SET state = 'conflict' WHERE destination = ? AND table_name = ? AND entity_id = ? AND state = 'pending'",
        destination,
        table,
        id,
    );
}

async function snapshot(db: LocalDb, table: string, row: LocalRow | null) {
    return row === null ? null : scrubRow(db, table, row);
}

async function raiseConflict(
    db: LocalDb,
    destination: string,
    table: string,
    id: string,
    kind: ConflictKind,
    fields: string[],
    local: LocalRow | null,
    remote: RemotePending,
    now: string,
): Promise<ReconcileOutcome> {
    await openConflict(db, destination, {
        table,
        entityId: id,
        kind,
        reason: kind === 'fields' ? 'field-conflict' : kind,
        remoteRevision: remote.revision,
        base: await snapshot(db, table, await readBase(db, destination, table, id)),
        local: await snapshot(db, table, local),
        remote: await snapshot(db, table, remote.row),
        fields,
        now,
    });
    await holdEntries(db, destination, table, id);
    return 'needs-decision';
}

/**
 * Concilia una entidad cuyo cambio del servidor esperaba a una edición local sin
 * enviar. Tres bandas: la versión base, la local y la remota.
 *  - Campos independientes: se fusionan solos.
 *  - El mismo campo cambiado de dos formas, o un borrado contra una edición: se
 *    conserva todo y decide una persona. Nada se resucita ni se pisa solo.
 */
export async function reconcileEntity(
    db: LocalDb,
    destination: string,
    table: string,
    id: string,
    now: string,
): Promise<ReconcileOutcome> {
    const remote = await loadRemotePending(db, destination, table, id);
    if (!remote) return 'none';

    const entries = await db.getAllAsync<{ state: string; op: 'upsert' | 'delete' }>(
        `SELECT state, op FROM sync_outbox WHERE destination = ? AND table_name = ? AND entity_id = ?
         AND state IN ('pending', 'conflict', 'sending') ORDER BY seq DESC`,
        destination,
        table,
        id,
    );
    if (entries.some((entry) => entry.state === 'sending')) return 'none'; // en vuelo: se concilia al terminar
    const unsent = entries[0];
    if (!unsent) {
        await applyRemote(db, destination, table, id, remote, now);
        return 'remote-applied';
    }

    const local = await readLocalRow(db, table, id);
    const localDeleted = unsent.op === 'delete' || isDeleted(local);
    const remoteDeleted = remote.op === 'delete' || isDeleted(remote.row);

    if (localDeleted && remoteDeleted) {
        await dropEntries(db, destination, table, id);
        await applyRemote(db, destination, table, id, { ...remote, op: 'delete', row: null }, now);
        return 'both-deleted';
    }
    if (localDeleted)
        return raiseConflict(db, destination, table, id, 'local-deleted', [], null, remote, now);
    if (remoteDeleted || local === null || remote.row === null) {
        return raiseConflict(db, destination, table, id, 'remote-deleted', [], local, remote, now);
    }

    const result = await mergeRows(
        db,
        table,
        await readBase(db, destination, table, id),
        local,
        remote.row,
    );
    if (result.conflicts.length > 0) {
        return raiseConflict(
            db,
            destination,
            table,
            id,
            'fields',
            result.conflicts,
            local,
            remote,
            now,
        );
    }

    const merged = await sealRow(db, table, result.merged);
    await withoutCapture(db, () => writeLocalRow(db, table, id, merged));
    await writeBase(
        db,
        destination,
        table,
        id,
        remote.revision,
        await scrubRow(db, table, remote.row),
    );
    await reopenEntry(db, destination, table, id, 'upsert', now);
    await clearRemotePending(db, destination, table, id);
    await closeConflicts(db, destination, table, id, now);
    return 'merged';
}

export interface ReconcileReport {
    merged: number;
    needsDecision: number;
    applied: number;
}

/** Concilia todo lo que esperaba. Cada entidad en su propia transacción: un fallo no deshace a las demás. */
export async function reconcileAll(
    db: LocalDb,
    destination: string,
    now: string,
): Promise<ReconcileReport> {
    const report: ReconcileReport = { merged: 0, needsDecision: 0, applied: 0 };
    for (const { table_name, entity_id } of await listRemotePending(db, destination)) {
        const outcomes: ReconcileOutcome[] = [];
        await inLocalTransaction(db, async (tx) => {
            outcomes.push(await reconcileEntity(tx, destination, table_name, entity_id, now));
        });
        const outcome = outcomes[0] ?? 'none';
        if (outcome === 'merged') report.merged += 1;
        else if (outcome === 'needs-decision') report.needsDecision += 1;
        else if (outcome === 'remote-applied' || outcome === 'both-deleted') report.applied += 1;
    }
    return report;
}
