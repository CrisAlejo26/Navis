import { describe, expect, it } from 'vitest';

import { findDuplicateCandidates, type PersonCandidate } from './sync-duplicates';

const person = (id: string, overrides: Partial<PersonCandidate> = {}): PersonCandidate => ({
    id,
    churchId: 'c1',
    firstName: 'Ana',
    lastName: 'Pérez',
    phone: null,
    email: null,
    ...overrides,
});

describe('posibles duplicados de creyentes', () => {
    it('el mismo nombre (sin acentos ni mayúsculas) es solo una posibilidad', () => {
        const pairs = findDuplicateCandidates([
            person('a'),
            person('b', { firstName: 'ANA', lastName: 'perez' }),
        ]);
        expect(pairs).toEqual([{ a: 'a', b: 'b', evidence: ['name'], confidence: 'possible' }]);
    });

    it('nombre y teléfono o correo a la vez es probable', () => {
        const pairs = findDuplicateCandidates([
            person('a', { phone: '+34 600 123 456' }),
            person('b', { phone: '600123456' }),
        ]);
        expect(pairs[0]).toMatchObject({ evidence: ['name', 'phone'], confidence: 'likely' });
    });

    it('un teléfono compartido con otro nombre es evidencia, no certeza: familias', () => {
        const pairs = findDuplicateCandidates([
            person('a', { firstName: 'Ana', phone: '600123456' }),
            person('b', { firstName: 'Luis', phone: '600123456' }),
        ]);
        expect(pairs).toEqual([{ a: 'a', b: 'b', evidence: ['phone'], confidence: 'possible' }]);
    });

    it('nunca cruza iglesias, aunque el nombre y el teléfono coincidan', () => {
        const pairs = findDuplicateCandidates([
            person('a', { phone: '600123456' }),
            person('b', { churchId: 'c2', phone: '600123456' }),
        ]);
        expect(pairs).toEqual([]);
    });

    it('un teléfono demasiado corto o un correo sin arroba no cuentan', () => {
        const pairs = findDuplicateCandidates([
            person('a', { firstName: 'X', phone: '1234', email: 'ana' }),
            person('b', { firstName: 'Y', phone: '1234', email: 'ana' }),
        ]);
        expect(pairs).toEqual([]);
    });
});
