import type { SyncChange } from '@navis/shared';

import type { LocalDb } from '@/data/local-db';

import { applyAliases } from './aliases';
import { saveRemotePending, writeBase } from './conflicts-store';
import { deleteLocalRow, writeLocalRow } from './local-row';
import { hasUnsent, revisionOf } from './outbox';
import { scrubRow } from './secret-cells';
import { toLocalRow } from './wire-row';

export type ApplyOutcome =
    | { kind: 'applied' }
    /** La entidad tiene una edición sin enviar: no se pisa; lo del servidor espera a la conciliación. */
    | { kind: 'deferred' }
    /** Ya se conocía esta revisión o una posterior. */
    | { kind: 'stale' }
    /** La base local no la aceptó (una restricción única, un dato que falta): se anota. */
    | { kind: 'failed'; reason: string };

/**
 * Aplica un cambio del servidor a SQLite. Va dentro de `withoutCapture` y de la
 * transacción de su página, así que no se apunta en la cola.
 *
 * - Con una edición local sin enviar sobre la misma entidad **no se toca**: la
 *   descarga no puede sobrescribir lo que la persona aún no ha subido. Lo del
 *   servidor se guarda aparte (`sync_remote_pending`) y la conciliación lo
 *   compara a tres bandas con la versión base y la edición local. Tampoco se
 *   adelanta la revisión base: así el servidor no deja pasar una subida a ciegas.
 * - Al aplicar, la fila queda también como versión base de la entidad (sin las
 *   contraseñas), que es contra lo que se compara la próxima edición.
 */
export async function applyChange(
    db: LocalDb,
    destination: string,
    change: SyncChange,
    now: string,
): Promise<ApplyOutcome> {
    if ((await revisionOf(db, destination, change.table, change.id)) >= change.revision) {
        return { kind: 'stale' };
    }

    try {
        const isDelete = change.op === 'delete' || change.row === null;
        let row = isDelete ? null : await toLocalRow(db, change.table, change.row ?? {});

        // Un creyente fusionado no se resucita, y lo que apunta a él se redirige al conservado.
        const verdict = await applyAliases(db, change.table, change.id, row);
        if (verdict.kind === 'ignore') return { kind: 'stale' };
        if (verdict.kind === 'redirect') row = verdict.row;

        if (await hasUnsent(db, destination, change.table, change.id)) {
            await saveRemotePending(db, destination, change.table, change.id, {
                revision: change.revision,
                op: isDelete ? 'delete' : 'upsert',
                row,
            });
            return { kind: 'deferred' };
        }

        if (row === null) await deleteLocalRow(db, change.table, change.id, now);
        else await writeLocalRow(db, change.table, change.id, row);

        const base = row === null ? null : await scrubRow(db, change.table, row);
        await writeBase(db, destination, change.table, change.id, change.revision, base);
        return { kind: 'applied' };
    } catch (error) {
        return { kind: 'failed', reason: error instanceof Error ? error.message : 'apply-failed' };
    }
}
