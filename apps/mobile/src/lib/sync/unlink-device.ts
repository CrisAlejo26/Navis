import { createApiClient } from '@navis/api-client';

import { useSyncConnection } from '@/stores/sync-connection';
import { deleteCredential, readCredential } from './credential';
import { NO_REDIRECT } from './link-device';

interface UnlinkOptions {
    fetchImpl?: typeof fetch;
    /** La copia previa; por defecto, la del teléfono. Si lanza, no se desvincula nada. */
    safetyBackup?: () => Promise<unknown>;
    /** Apaga el registro de cambios locales; por defecto, en la base del teléfono. */
    releaseCapture?: () => Promise<void>;
}

async function deviceReleaseCapture(): Promise<void> {
    // Import perezoso por lo mismo que la copia previa: solo hace falta al ejecutarlo.
    const [{ getDb }, { setCaptureDestination }] = await Promise.all([
        import('@/data/db'),
        import('./capture'),
    ]);
    await setCaptureDestination(await getDb(), null);
}

async function deviceSafetyBackup(): Promise<unknown> {
    // Import perezoso: arrastra el sistema de ficheros nativo, que solo hace falta al ejecutarlo.
    const { ensureSafetyBackup } = await import('@/lib/backup/safety-backup-device');
    return ensureSafetyBackup('disconnect');
}

/**
 * Vuelve al modo local. Primero intenta revocar la credencial en el servidor
 * (si no hay red, queda pendiente y se revoca desde la web); en cualquier caso
 * la credencial local se borra y los datos del teléfono no se tocan. Antes deja una copia verificada: si no puede,
 * no desvincula nada.
 */
export async function unlinkDevice(
    options: UnlinkOptions = {},
): Promise<{ revoked: boolean; aborted: boolean }> {
    const {
        fetchImpl,
        safetyBackup = deviceSafetyBackup,
        releaseCapture = deviceReleaseCapture,
    } = options;
    try {
        await safetyBackup();
    } catch {
        return { revoked: false, aborted: true };
    }
    const { link, clear } = useSyncConnection.getState();
    const credential = await readCredential();
    let revoked = false;

    if (link && credential) {
        try {
            const api = createApiClient({
                baseUrl: link.apiUrl,
                fetchImpl,
                getAuthHeaders: () => ({ Authorization: `Bearer ${credential}` }),
            });
            await api.delete<void>(`/devices/${link.deviceId}`, undefined, NO_REDIRECT);
            revoked = true;
        } catch {
            revoked = false;
        }
    }

    await deleteCredential();
    // La cola ya escrita se conserva (es de su destino y no se envía a otro), pero deja de crecer.
    await releaseCapture();
    clear();
    return { revoked, aborted: false };
}
