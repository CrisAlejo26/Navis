import type { LocalRow } from '@navis/shared';

import type { LocalDb } from '@/data/local-db';
import { inLocalTransaction } from '@/data/local-transaction';

import { withoutCapture } from './capture';
import {
    clearRemotePending,
    closeConflicts,
    getConflict,
    loadRemotePending,
    readBase,
    writeBase,
    type RemotePending,
} from './conflicts-store';
import { readLocalRow, writeLocalRow } from './local-row';
import { dropEntries, reopenEntry } from './outbox';
import { applyRemote } from './reconcile';
import { mergeRows } from './merge-row';
import { scrubRow, sealRow, unsealRow } from './secret-cells';

/** La decisión de una persona sobre un campo: lo suyo, lo del servidor, o un valor combinado escrito a mano. */
export type FieldChoice = 'local' | 'remote' | { custom: string };

export type Decision =
    | { kind: 'fields'; choices: Record<string, FieldChoice> }
    | { kind: 'remote-deleted'; choice: 'accept-deletion' | 'keep-mine' }
    | { kind: 'local-deleted'; choice: 'delete' | 'keep-remote' };

export type ResolveOutcome =
    | 'resolved'
    /** El conflicto ya no existe, o lo del servidor ya no está en espera. */
    | 'missing'
    /** La decisión no corresponde al conflicto (otro tipo, o faltan campos por decidir). */
    | 'invalid';

async function settle(
    db: LocalDb,
    destination: string,
    table: string,
    id: string,
    now: string,
): Promise<void> {
    await clearRemotePending(db, destination, table, id);
    await closeConflicts(db, destination, table, id, now);
}

/**
 * Aplica la decisión sobre un conflicto abierto. Parte de lo que hay **ahora**
 * (la fila local de este momento, lo último del servidor y la versión base), no
 * de la instantánea que se enseñó: si la persona editó mientras decidía, cuenta.
 *
 * Lo que sube después lo hace con la revisión del servidor como base. Si otro
 * volvió a editar mientras tanto, el servidor lo devuelve como conflicto y se
 * vuelve a comparar: una resolución nunca pisa a ciegas.
 */
export async function resolveConflict(
    db: LocalDb,
    destination: string,
    conflictId: number,
    decision: Decision,
    now: string,
): Promise<ResolveOutcome> {
    const conflict = await getConflict(db, destination, conflictId);
    if (!conflict || conflict.kind !== decision.kind) return conflict ? 'invalid' : 'missing';
    const table = conflict.table_name;
    const id = conflict.entity_id;
    const remote = await loadRemotePending(db, destination, table, id);
    if (!remote) return 'missing';

    let outcome: ResolveOutcome = 'resolved';
    await inLocalTransaction(db, async (tx) => {
        outcome = await apply(tx, destination, table, id, remote, decision, now);
    });
    return outcome;
}

async function apply(
    db: LocalDb,
    destination: string,
    table: string,
    id: string,
    remote: RemotePending,
    decision: Decision,
    now: string,
): Promise<ResolveOutcome> {
    const remoteBase = remote.row === null ? null : await scrubRow(db, table, remote.row);

    if (decision.kind === 'remote-deleted') {
        if (decision.choice === 'accept-deletion') {
            await dropEntries(db, destination, table, id);
            await applyRemote(
                db,
                destination,
                table,
                id,
                { ...remote, op: 'delete', row: null },
                now,
            );
            return 'resolved';
        }
        // Conservar lo mío: vuelve a subirse sobre la revisión del borrado (restaurar lo autoriza el servidor).
        await writeBase(db, destination, table, id, remote.revision, null);
        await reopenEntry(db, destination, table, id, 'upsert', now);
    } else if (decision.kind === 'local-deleted') {
        if (decision.choice === 'keep-remote') {
            await dropEntries(db, destination, table, id);
            await applyRemote(db, destination, table, id, remote, now);
            return 'resolved';
        }
        await writeBase(db, destination, table, id, remote.revision, remoteBase);
        await reopenEntry(db, destination, table, id, 'delete', now);
    } else {
        const local = await readLocalRow(db, table, id);
        if (!local || !remote.row) return 'missing';
        const result = await mergeRows(
            db,
            table,
            await readBase(db, destination, table, id),
            local,
            remote.row,
        );
        const remoteRow = await unsealRow(table, remote.row);
        const row: LocalRow = { ...result.merged };
        for (const field of result.conflicts) {
            const choice = decision.choices[field];
            if (choice === undefined) return 'invalid';
            row[field] =
                choice === 'local'
                    ? (result.merged[field] ?? null)
                    : choice === 'remote'
                      ? (remoteRow[field] ?? null)
                      : choice.custom;
        }
        await withoutCapture(db, async () =>
            writeLocalRow(db, table, id, await sealRow(db, table, row)),
        );
        await writeBase(db, destination, table, id, remote.revision, remoteBase);
        await reopenEntry(db, destination, table, id, 'upsert', now);
    }

    await settle(db, destination, table, id, now);
    return 'resolved';
}
