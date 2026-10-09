import { describe, expect, it } from 'vitest';

import {
    cellsFromWire,
    cellsToWire,
    containsDeviceEnvelope,
    type DeviceCellEnvelope,
} from './sync-cells';

const seal = (plain: string): Promise<DeviceCellEnvelope> =>
    Promise.resolve({ navisCipher: 1, keyId: 'k1', sealed: `sellado:${plain}` });
const open = (envelope: DeviceCellEnvelope): Promise<string> =>
    Promise.resolve(envelope.sealed.replace('sellado:', ''));

describe('celdas protegidas en la sincronización', () => {
    it('sube en claro lo que el teléfono tenía sellado y no toca el resto', async () => {
        const local = { nombre: 'Ana', clave: await seal('portal-2026') };
        const wire = await cellsToWire(local, open);
        expect(wire).toEqual({ nombre: 'Ana', clave: 'portal-2026' });
        expect(containsDeviceEnvelope(wire)).toBe(false);
    });

    it('baja la contraseña y la sella con la clave del aparato, solo en las columnas de contraseña', async () => {
        const local = await cellsFromWire({ nombre: 'Ana', clave: 'portal-2026' }, ['clave'], seal);
        expect(local.nombre).toBe('Ana');
        expect(containsDeviceEnvelope(local)).toBe(true);
        expect(await cellsToWire(local, open)).toEqual({ nombre: 'Ana', clave: 'portal-2026' });
    });

    it('una contraseña vacía se queda vacía', async () => {
        expect(await cellsFromWire({ clave: '' }, ['clave'], seal)).toEqual({ clave: '' });
    });
});
