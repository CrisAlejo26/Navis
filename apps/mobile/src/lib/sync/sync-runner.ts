import type { LocalDb } from '@/data/local-db';

import { retryDelayMs } from './backoff';
import { destinationOf, setCaptureDestination } from './capture';
import { runSync, type SyncRunResult } from './engine';
import { outboxCounts } from './outbox';
import type { SyncApi } from './sync-api';

export interface SyncOptions {
    /** La pidió la persona con el botón: no se aplaza por batería. */
    manual?: boolean;
}

export interface RunnerLink {
    apiUrl: string;
    account: { id: string };
}

export interface RunnerStatus {
    set: (partial: {
        running?: boolean;
        state?: SyncRunResult['state'] | null;
        lastSyncAt?: string | null;
        pending?: number;
        conflicts?: number;
        rejected?: number;
    }) => void;
}

export interface RunnerDeps {
    getLink: () => RunnerLink | null;
    getDb: () => Promise<LocalDb>;
    /** `null` si falta la credencial: no hay con qué autenticarse. */
    makeApi: (link: RunnerLink) => Promise<SyncApi | null>;
    status: RunnerStatus;
    now?: () => string;
    /** Bytes libres del teléfono, para no bajar datos sin espacio. */
    freeSpace?: () => number;
    /** Si una vuelta automática debe esperar (batería baja). La manual nunca espera. */
    shouldDefer?: () => Promise<boolean>;
    /** Para reintentar con espera; en los tests se sustituye. */
    schedule?: (callback: () => void, delayMs: number) => unknown;
    cancel?: (handle: unknown) => void;
}

export interface SyncRunner {
    /** Una vuelta completa. Si ya hay una en marcha, devuelve **esa** (un solo coordinador). */
    syncNow: (options?: SyncOptions) => Promise<SyncRunResult | null>;
    /** Recalcula el estado de la cola sin hablar con el servidor (para pintar la pantalla). */
    refresh: () => Promise<void>;
    stop: () => void;
}

/**
 * El coordinador único. Garantiza que nunca hay dos vueltas a la vez (dos
 * trabajadores enviando la misma operación), alinea el registro de cambios con
 * el vínculo actual y reintenta con espera creciente cuando falla la red. Un
 * 401, un 403 o un cambio de instalación no se reintentan solos: necesitan a la
 * persona (o, para el último, el bootstrap de la Fase 7).
 */
export function createSyncRunner(deps: RunnerDeps): SyncRunner {
    const schedule = deps.schedule ?? ((callback, delay) => setTimeout(callback, delay));
    const cancel = deps.cancel ?? ((handle) => clearTimeout(handle as NodeJS.Timeout));
    const now = deps.now ?? (() => new Date().toISOString());
    let inflight: Promise<SyncRunResult | null> | null = null;
    let timer: unknown = null;
    let attempt = 0;

    function clearRetry(): void {
        if (timer !== null) cancel(timer);
        timer = null;
    }

    async function run(options: SyncOptions): Promise<SyncRunResult | null> {
        const link = deps.getLink();
        const db = await deps.getDb();
        // Sin vínculo no se toca el registro: desvincular ya lo apagó. En una tarea en
        // segundo plano el vínculo puede no haberse cargado todavía, y apagarlo aquí
        // perdería cambios.
        if (!link) return null;
        if (!options.manual && (await deps.shouldDefer?.())) return null;
        const destination = destinationOf(link);
        // Alinea el registro con el vínculo: cubre teléfonos vinculados antes de existir la cola.
        await setCaptureDestination(db, destination);

        const api = await deps.makeApi(link);
        if (!api) {
            deps.status.set({ state: 'needsAuth', ...(await outboxCounts(db, destination)) });
            return null;
        }

        deps.status.set({ running: true });
        const result = await runSync({
            db,
            api,
            destination,
            now,
            freeSpace: deps.freeSpace,
        });
        deps.status.set({
            running: false,
            state: result.state,
            pending: result.counts.pending,
            conflicts: result.counts.conflicts,
            rejected: result.counts.rejected,
            ...(result.state === 'connected' || result.state === 'conflicts'
                ? { lastSyncAt: now() }
                : {}),
        });

        clearRetry();
        if (result.state === 'offline') {
            timer = schedule(() => void syncNow({ manual: true }), retryDelayMs(attempt));
            attempt += 1;
        } else {
            attempt = 0;
        }
        return result;
    }

    function syncNow(options: SyncOptions = {}): Promise<SyncRunResult | null> {
        if (inflight) return inflight;
        inflight = run(options)
            .catch((error: unknown) => {
                deps.status.set({ running: false });
                throw error;
            })
            .finally(() => {
                inflight = null;
            });
        return inflight;
    }

    async function refresh(): Promise<void> {
        const link = deps.getLink();
        if (!link) return;
        const counts = await outboxCounts(await deps.getDb(), destinationOf(link));
        deps.status.set({
            pending: counts.pending,
            conflicts: counts.conflicts,
            rejected: counts.rejected,
        });
    }

    return { syncNow, refresh, stop: clearRetry };
}
