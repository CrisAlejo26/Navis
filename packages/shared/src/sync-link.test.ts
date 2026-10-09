import { describe, expect, it } from 'vitest';

import { normalizeApiUrl } from './sync-link';

describe('normalizeApiUrl', () => {
    it('quita espacios y la barra final', () => {
        expect(normalizeApiUrl('  https://navis.org/api/v1/ ', false)).toEqual({
            ok: true,
            url: 'https://navis.org/api/v1',
        });
    });

    it('rechaza http salvo que se permita para desarrollo', () => {
        expect(normalizeApiUrl('http://192.168.1.5:3000/api/v1', false)).toEqual({
            ok: false,
            reason: 'insecure',
        });
        expect(normalizeApiUrl('http://192.168.1.5:3000/api/v1', true)).toEqual({
            ok: true,
            url: 'http://192.168.1.5:3000/api/v1',
        });
    });

    it('rechaza lo que no es una dirección, otros protocolos y direcciones con credenciales', () => {
        for (const bad of ['', 'navis', 'ftp://x.org', 'https://u:p@x.org', 'https://x.org/?t=1']) {
            expect(normalizeApiUrl(bad, true)).toEqual({ ok: false, reason: 'invalid' });
        }
    });
});
