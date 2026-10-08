import { accessCounts, accessMatches, accessStatus } from './access-status';

const NOW = new Date('2026-10-09T12:00:00Z');

describe('estado de un acceso de lectura', () => {
    it('distingue en vigor, caducado y desactivado', () => {
        expect(accessStatus({ isActive: true, expiresAt: null }, NOW)).toBe('active');
        expect(accessStatus({ isActive: true, expiresAt: '2026-10-10T23:59:59.999Z' }, NOW)).toBe(
            'active',
        );
        expect(accessStatus({ isActive: true, expiresAt: '2026-10-08T23:59:59.999Z' }, NOW)).toBe(
            'expired',
        );
        expect(accessStatus({ isActive: false, expiresAt: null }, NOW)).toBe('inactive');
    });

    it('un acceso desactivado cuenta como desactivado aunque además haya caducado', () => {
        expect(accessStatus({ isActive: false, expiresAt: '2026-01-01T00:00:00Z' }, NOW)).toBe(
            'inactive',
        );
    });

    it('cuenta cada estado', () => {
        expect(
            accessCounts(
                [
                    { isActive: true, expiresAt: null },
                    { isActive: true, expiresAt: null },
                    { isActive: true, expiresAt: '2026-01-01T00:00:00Z' },
                    { isActive: false, expiresAt: null },
                ],
                NOW,
            ),
        ).toEqual({ active: 2, expired: 1, inactive: 1 });
        expect(accessCounts([], NOW)).toEqual({ active: 0, expired: 0, inactive: 0 });
    });

    it('busca por etiqueta, usuario o creyente, sin mayúsculas ni acentos', () => {
        const viewer = { label: 'Ancianos', username: 'ancianos', believerName: 'José Pérez' };
        expect(accessMatches(viewer, '')).toBe(true);
        expect(accessMatches(viewer, ' ANCI ')).toBe(true);
        expect(accessMatches(viewer, 'jose perez')).toBe(true);
        expect(accessMatches({ ...viewer, believerName: null }, 'perez')).toBe(false);
        expect(accessMatches(viewer, 'diáconos')).toBe(false);
    });
});
