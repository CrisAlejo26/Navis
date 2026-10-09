import type { LocalDb } from '@/data/local-db';

import { classifyError, type SyncFailure } from './classify-error';
import { outboxCounts, type OutboxCounts } from './outbox';
import { pullChanges, type PullReport } from './pull';
import { reconcileAll, type ReconcileReport } from './reconcile';
import { pushOutbox, type PushReport } from './push';
import { hasRoomToDownload } from './resources';
import type { SyncApi } from './sync-api';

/** El resultado de una vuelta del motor. */
export type SyncRunState =
    /** Al día con el servidor. */
    | 'connected'
    /** Vinculado, pero el servidor aún no tiene la sincronización activada. */
    | 'disabled'
    | 'conflicts'
    /** Sin espacio para aplicar descargas: se sube lo pendiente, no se baja. */
    | 'lowStorage'
    | SyncFailure;

export interface SyncRunResult {
    state: SyncRunState;
    push: PushReport;
    pull: PullReport;
    reconcile: ReconcileReport;
    counts: OutboxCounts;
}

export interface SyncDeps {
    db: LocalDb;
    api: SyncApi;
    destination: string;
    now?: () => string;
    /** Bytes libres del teléfono; sin él no se comprueba el espacio. */
    freeSpace?: () => number;
}

const EMPTY_PUSH: PushReport = { sent: 0, conflicts: 0, rejected: 0 };
const EMPTY_PULL: PullReport = { applied: 0, deferred: 0, failed: 0, pages: 0 };
const EMPTY_RECONCILE: ReconcileReport = { merged: 0, needsDecision: 0, applied: 0 };

/**
 * Una vuelta completa: comprobar que el servidor sincroniza, bajar los cambios y
 * subir la cola. Nunca lanza: un fallo se clasifica y se devuelve como
 * estado, porque el trabajo local ya está a salvo en la cola. Lo que se
 * confirmó antes del fallo se conserva (cada resultado y cada página se guardan
 * al recibirse).
 *
 * El coordinador único por destino lo garantiza `sync-runner.ts`.
 */
export async function runSync(deps: SyncDeps): Promise<SyncRunResult> {
    const { db, api, destination } = deps;
    const now = deps.now ?? (() => new Date().toISOString());
    let push = EMPTY_PUSH;
    let pull = EMPTY_PULL;
    let reconcile = EMPTY_RECONCILE;

    const roomToDownload = deps.freeSpace ? hasRoomToDownload(deps.freeSpace()) : true;

    const finish = async (state: SyncRunState): Promise<SyncRunResult> => ({
        state,
        push,
        pull,
        reconcile,
        counts: await outboxCounts(db, destination),
    });

    try {
        const capabilities = await api.capabilities();
        if (!capabilities.dataSyncEnabled) return await finish('disabled');

        // Primero se descarga: ahí se descubre que el servidor es otro (restaurado, o con otro
        // historial) y las revisiones base de la cola ya no valen. Subir antes sería aplicarlas a ciegas.
        if (roomToDownload) pull = await pullChanges(db, api, destination, now);
        // Lo que esperaba a una edición local se concilia ANTES de subir: lo compatible se fusiona
        // solo y lo demás queda apartado para decidir; nada llega al servidor a ciegas.
        reconcile = await reconcileAll(db, destination, now());
        push = await pushOutbox(db, api, destination, now);
    } catch (error) {
        return finish(classifyError(error));
    }

    if (!roomToDownload) return finish('lowStorage');
    const result = await finish('connected');
    return result.counts.conflicts > 0 ? { ...result, state: 'conflicts' } : result;
}
