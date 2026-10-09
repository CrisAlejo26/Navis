import { createApiClient } from '@navis/api-client';

import { useSyncConnection } from '@/stores/sync-connection';
import { deleteCredential, readCredential } from './credential';
import { NO_REDIRECT } from './link-device';

/**
 * Vuelve al modo local. Primero intenta revocar la credencial en el servidor
 * (si no hay red, queda pendiente y se revoca desde la web); en cualquier caso
 * la credencial local se borra y los datos del teléfono no se tocan.
 */
export async function unlinkDevice(fetchImpl?: typeof fetch): Promise<{ revoked: boolean }> {
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
    clear();
    return { revoked };
}
