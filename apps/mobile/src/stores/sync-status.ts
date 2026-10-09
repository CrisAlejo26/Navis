import { create } from 'zustand';

import type { SyncRunState } from '@/lib/sync/engine';

/**
 * Lo que la pantalla puede decir de la sincronización ahora mismo. Vive en
 * memoria: es el resultado de la última vuelta, no un dato que haya que
 * conservar (la cola y el cursor ya están en SQLite).
 */
export interface SyncStatus {
    running: boolean;
    /** `null` hasta la primera vuelta de esta sesión. */
    state: SyncRunState | null;
    lastSyncAt: string | null;
    pending: number;
    conflicts: number;
    rejected: number;
    set: (partial: Partial<Omit<SyncStatus, 'set'>>) => void;
}

export const useSyncStatus = create<SyncStatus>()((set) => ({
    running: false,
    state: null,
    lastSyncAt: null,
    pending: 0,
    conflicts: 0,
    rejected: 0,
    set: (partial) => set(partial),
}));
