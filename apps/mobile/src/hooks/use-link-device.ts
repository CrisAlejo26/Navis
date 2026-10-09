import { linkIdentity } from '@navis/shared';
import { useState } from 'react';
import { Platform } from 'react-native';

import { exchangeToken, inspectServer, type LinkErrorCode } from '@/lib/sync/link-device';
import { ensureSafetyBackup } from '@/lib/backup/safety-backup-device';
import { saveCredential } from '@/lib/sync/credential';
import { useLocalSession } from '@/stores/local-session';
import { useSyncConnection } from '@/stores/sync-connection';

/**
 * Vincular el teléfono: comprueba el servidor, canjea el código y guarda la
 * credencial en SecureStore y el destino en el almacén. No toca ningún dato de
 * negocio. `http` solo se admite en desarrollo (el código viaja en el cuerpo).
 */
export function useLinkDevice() {
    const setLink = useSyncConnection((state) => state.setLink);
    const [url, setUrl] = useState('');
    const [token, setToken] = useState('');
    const [deviceName, setDeviceName] = useState(Platform.OS === 'ios' ? 'iPhone' : 'Android');
    const [busy, setBusy] = useState<'checking' | 'linking' | null>(null);
    const [error, setError] = useState<LinkErrorCode | null>(null);

    const canSubmit = url.trim() !== '' && token.trim() !== '' && deviceName.trim() !== '';

    async function submit(): Promise<void> {
        setError(null);
        setBusy('checking');
        // Conectar es el punto de partida de todo lo que viene: antes, una copia verificada.
        try {
            await ensureSafetyBackup('connect');
        } catch {
            setBusy(null);
            setError('safetyFailed');
            return;
        }
        const server = await inspectServer(url, { allowHttp: __DEV__ });
        if (!server.ok) {
            setBusy(null);
            setError(server.error);
            return;
        }

        setBusy('linking');
        const exchanged = await exchangeToken({
            url: server.value.url,
            token,
            deviceName,
        });
        if (!exchanged.ok) {
            setBusy(null);
            setError(exchanged.error);
            return;
        }

        const { credential, device, account } = exchanged.value;
        const localUserId = useLocalSession.getState().session?.userId;
        await saveCredential(credential);
        setLink({
            apiUrl: server.value.url,
            installationName: server.value.capabilities.installationName,
            deviceId: device.id,
            deviceName: device.name,
            account,
            linkedAt: new Date().toISOString(),
            identities: localUserId
                ? linkIdentity([], {
                      localUserId,
                      remoteUserId: account.id,
                      verifiedBy: 'device-link',
                  })
                : [],
        });
        setBusy(null);
    }

    return {
        url,
        setUrl,
        token,
        setToken,
        deviceName,
        setDeviceName,
        busy,
        error,
        canSubmit,
        submit,
    };
}
