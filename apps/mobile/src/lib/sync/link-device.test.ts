import { SYNC_PROTOCOL_VERSION } from '@navis/shared';

import { exchangeToken, inspectServer } from './link-device';

function jsonResponse(status: number, body: unknown): Response {
    return new Response(JSON.stringify(body), {
        status,
        headers: { 'content-type': 'application/json' },
    });
}

const CAPABILITIES = {
    installationName: 'Navis',
    protocolVersion: SYNC_PROTOCOL_VERSION,
    dataSyncEnabled: false,
    linkTtlMinutes: 10,
};

describe('inspectServer', () => {
    it('acepta un servidor compatible y devuelve la dirección normalizada', async () => {
        const fetchImpl = jest.fn((_url: RequestInfo | URL, _init?: RequestInit) =>
            Promise.resolve(jsonResponse(200, CAPABILITIES)),
        );
        const result = await inspectServer('https://navis.org/api/v1/ ', {
            allowHttp: false,
            fetchImpl,
        });
        expect(result).toMatchObject({ ok: true, value: { url: 'https://navis.org/api/v1' } });
        expect(fetchImpl).toHaveBeenCalledWith(
            'https://navis.org/api/v1/sync/capabilities',
            expect.objectContaining({ redirect: 'error' }),
        );
    });

    it('rechaza http fuera de desarrollo sin llegar a conectar', async () => {
        const fetchImpl = jest.fn();
        const result = await inspectServer('http://navis.org/api/v1', {
            allowHttp: false,
            fetchImpl,
        });
        expect(result).toEqual({ ok: false, error: 'insecureUrl' });
        expect(fetchImpl).not.toHaveBeenCalled();
    });

    it('avisa cuando el servidor habla otro protocolo', async () => {
        const fetchImpl = jest.fn(() =>
            Promise.resolve(jsonResponse(200, { ...CAPABILITIES, protocolVersion: 99 })),
        );
        const result = await inspectServer('https://navis.org/api/v1', {
            allowHttp: false,
            fetchImpl,
        });
        expect(result).toEqual({ ok: false, error: 'incompatible' });
    });

    it('distingue un servidor inalcanzable', async () => {
        const fetchImpl = jest.fn(() => Promise.reject(new TypeError('Network request failed')));
        const result = await inspectServer('https://navis.org/api/v1', {
            allowHttp: false,
            fetchImpl,
        });
        expect(result).toEqual({ ok: false, error: 'unreachable' });
    });
});

describe('exchangeToken', () => {
    const input = { url: 'https://navis.org/api/v1', token: ' nvl_abc ', deviceName: ' Pixel ' };

    it('devuelve la credencial y manda el token sin espacios', async () => {
        const credential = {
            credential: 'nvd_secreta',
            device: {
                id: '8f0a1c52-7f6e-4d38-9a40-0f6d6a5b1c11',
                name: 'Pixel',
                createdAt: '2026-10-09T10:00:00.000Z',
                lastSeenAt: null,
                current: true,
            },
            account: { id: 'u1', name: 'Ana', email: 'ana@navis.test' },
        };
        const fetchImpl = jest.fn((_url: RequestInfo | URL, _init?: RequestInit) =>
            Promise.resolve(jsonResponse(200, credential)),
        );
        const result = await exchangeToken(input, { fetchImpl });
        expect(result).toMatchObject({ ok: true, value: { credential: 'nvd_secreta' } });
        const sent = fetchImpl.mock.calls[0]?.[1]?.body;
        const payload: unknown = typeof sent === 'string' ? JSON.parse(sent) : null;
        expect(payload).toEqual({
            token: 'nvl_abc',
            deviceName: 'Pixel',
        });
    });

    it('traduce un 403 a código inválido o caducado', async () => {
        const fetchImpl = jest.fn(() => Promise.resolve(jsonResponse(403, { message: 'no' })));
        expect(await exchangeToken(input, { fetchImpl })).toEqual({
            ok: false,
            error: 'invalidToken',
        });
    });
});
