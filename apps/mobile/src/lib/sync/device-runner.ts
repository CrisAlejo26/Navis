import { createApiClient } from '@navis/api-client';
import * as Network from 'expo-network';
import { AppState } from 'react-native';

import { getDb } from '@/data/db';
import { useSyncConnection } from '@/stores/sync-connection';
import { useSyncStatus } from '@/stores/sync-status';

import { readCredential } from './credential';
import { deferForBattery, deviceFreeSpace } from './device-resources';
import { createSyncApi } from './sync-api';
import { createSyncRunner } from './sync-runner';

/** Cada cuánto se sincroniza mientras la app está abierta y a la vista. */
const PERIODIC_MS = 60_000;

/** El coordinador del teléfono: su base, su vínculo, su credencial en SecureStore. */
export const syncRunner = createSyncRunner({
    getLink: () => useSyncConnection.getState().link,
    getDb,
    status: { set: (partial) => useSyncStatus.getState().set(partial) },
    freeSpace: deviceFreeSpace,
    shouldDefer: deferForBattery,
    makeApi: async (link) => {
        const credential = await readCredential();
        if (!credential) return null;
        return createSyncApi(
            createApiClient({
                baseUrl: link.apiUrl,
                getAuthHeaders: () => ({ Authorization: `Bearer ${credential}` }),
            }),
        );
    },
});

/**
 * Cuándo sincronizar: al abrir, al volver a primer plano, al recuperar la red,
 * cada minuto con la app a la vista y cuando la persona lo pide. No promete nada
 * con la app cerrada: el sistema operativo decide cuándo deja ejecutar tareas en
 * segundo plano, así que el trabajo pendiente espera en la cola hasta la
 * siguiente ocasión. Devuelve la función que lo desmonta todo.
 */
export function startSyncScheduler(): () => void {
    const run = (): void => void syncRunner.syncNow().catch(() => undefined);
    run();

    const appState = AppState.addEventListener('change', (state) => {
        if (state === 'active') run();
    });
    const network = Network.addNetworkStateListener((state) => {
        if (state.isConnected && state.isInternetReachable !== false) run();
    });
    const interval = setInterval(() => {
        if (AppState.currentState === 'active') run();
    }, PERIODIC_MS);

    return () => {
        appState.remove();
        network.remove();
        clearInterval(interval);
        syncRunner.stop();
    };
}
