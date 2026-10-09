import * as SecureStore from 'expo-secure-store';

import { useSyncConnection, type SyncLink } from '@/stores/sync-connection';
import { unlinkDevice } from './unlink-device';

const LINK: SyncLink = {
    apiUrl: 'https://navis.org/api/v1',
    installationName: 'Navis',
    deviceId: '8f0a1c52-7f6e-4d38-9a40-0f6d6a5b1c11',
    deviceName: 'Pixel',
    account: { id: 'u1', name: 'Ana', email: 'ana@navis.test' },
    linkedAt: '2026-10-09T10:00:00.000Z',
    identities: [{ localUserId: 'l1', remoteUserId: 'u1', verifiedBy: 'device-link' }],
};

const safetyBackup = jest.fn(() => Promise.resolve({}));
const releaseCapture = jest.fn(() => Promise.resolve());

describe('unlinkDevice', () => {
    beforeEach(() => {
        jest.mocked(SecureStore.getItemAsync).mockResolvedValue('nvd_secreta');
        jest.mocked(SecureStore.deleteItemAsync).mockClear();
        releaseCapture.mockClear();
        useSyncConnection.setState({ link: LINK });
    });

    it('revoca el dispositivo con su credencial y vuelve al modo local', async () => {
        const fetchImpl = jest.fn((_url: RequestInfo | URL, _init?: RequestInit) =>
            Promise.resolve(new Response(null, { status: 204 })),
        );
        const result = await unlinkDevice({ fetchImpl, safetyBackup, releaseCapture });

        expect(result).toEqual({ revoked: true, aborted: false });
        expect(fetchImpl.mock.calls[0]?.[0]).toBe(`${LINK.apiUrl}/devices/${LINK.deviceId}`);
        const headers = new Headers(fetchImpl.mock.calls[0]?.[1]?.headers);
        expect(headers.get('authorization')).toBe('Bearer nvd_secreta');
        expect(useSyncConnection.getState().link).toBeNull();
        expect(SecureStore.deleteItemAsync).toHaveBeenCalled();
    });

    it('vuelve al modo local aunque no haya red, avisando de que no se pudo revocar', async () => {
        const fetchImpl = jest.fn(() => Promise.reject(new TypeError('Network request failed')));
        const result = await unlinkDevice({ fetchImpl, safetyBackup, releaseCapture });

        expect(result).toEqual({ revoked: false, aborted: false });
        expect(useSyncConnection.getState().link).toBeNull();
        expect(SecureStore.deleteItemAsync).toHaveBeenCalled();
    });

    it('no desvincula nada si no se puede dejar la copia previa', async () => {
        const failing = jest.fn(() => Promise.reject(new Error('sin espacio')));
        const fetchImpl = jest.fn();
        const result = await unlinkDevice({ fetchImpl, safetyBackup: failing, releaseCapture });

        expect(result).toEqual({ revoked: false, aborted: true });
        expect(useSyncConnection.getState().link).toEqual(LINK);
        expect(fetchImpl).not.toHaveBeenCalled();
        expect(SecureStore.deleteItemAsync).not.toHaveBeenCalled();
        expect(releaseCapture).not.toHaveBeenCalled();
    });
});
