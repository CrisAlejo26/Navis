import { useEffect } from 'react';

import { registerBackgroundSync, unregisterBackgroundSync } from '@/lib/sync/background-task';
import { startSyncScheduler } from '@/lib/sync/device-runner';
import { useSyncConnection } from '@/stores/sync-connection';

/**
 * Mantiene el planificador de sincronización encendido mientras el teléfono
 * esté vinculado, y lo apaga al desvincular. Sin vínculo no corre nada.
 */
export function useSyncScheduler(): void {
    const linked = useSyncConnection((state) => state.link !== null);
    useEffect(() => (linked ? startSyncScheduler() : undefined), [linked]);
    // La tarea de fondo se registra al vincular y se retira al desvincular; no se toca al desmontar.
    useEffect(() => {
        void (linked ? registerBackgroundSync() : unregisterBackgroundSync());
    }, [linked]);
}
