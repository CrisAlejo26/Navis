import { describe, expect, it } from 'vitest';

import { EMPTY_POLICY, mergeThreeWay } from './sync-merge';
import { mergePolicyFor } from './sync-merge-policy';

const base = { id: 'b1', first_name: 'Ana', phone: '111', city: 'Elda', updated_at: '2026-01-01' };

describe('fusión a tres bandas', () => {
    it('toma de cada lado lo único que cambió en él', () => {
        const local = { ...base, phone: '222' };
        const remote = { ...base, city: 'Petrer' };
        const result = mergeThreeWay(base, local, remote);
        expect(result.merged).toMatchObject({ phone: '222', city: 'Petrer', first_name: 'Ana' });
        expect(result.conflicts).toEqual([]);
        expect(result.fromRemote).toEqual(['city']);
    });

    it('si los dos cambiaron el mismo campo de forma distinta, es un conflicto y se conserva lo local', () => {
        const result = mergeThreeWay(
            base,
            { ...base, first_name: 'Anita' },
            { ...base, first_name: 'Ana María' },
        );
        expect(result.conflicts).toEqual(['first_name']);
        expect(result.merged.first_name).toBe('Anita');
    });

    it('si los dos llegaron al mismo valor no hay conflicto', () => {
        const result = mergeThreeWay(base, { ...base, phone: '999' }, { ...base, phone: '999' });
        expect(result.conflicts).toEqual([]);
        expect(result.merged.phone).toBe('999');
    });

    it('sin versión base (nunca se confirmó) todo lo distinto es conflicto', () => {
        const result = mergeThreeWay(null, { ...base, phone: '1' }, { ...base, phone: '2' });
        expect(result.conflicts).toEqual(['phone']);
    });

    it('la hora del teléfono no decide: updated_at se queda con la más reciente y no es edición', () => {
        const result = mergeThreeWay(
            base,
            { ...base, updated_at: '2026-03-01' },
            { ...base, updated_at: '2026-02-01' },
            mergePolicyFor('believers'),
        );
        expect(result.conflicts).toEqual([]);
        expect(result.merged.updated_at).toBe('2026-03-01');
    });

    describe('políticas por tabla', () => {
        it('en el orden manda el servidor, así que nadie se pierde', () => {
            const row = { id: 'm1', list_id: 'l', position: 1 };
            const members = mergeThreeWay(
                row,
                { ...row, position: 3 },
                { ...row, position: 2 },
                mergePolicyFor('list_members'),
            );
            expect(members.conflicts).toEqual([]);
            expect(members.merged.position).toBe(2);
        });

        it('las celdas de una fila se fusionan celda a celda', () => {
            const row = {
                id: 'r1',
                data: JSON.stringify({ nombre: 'Ana', edad: 30, ciudad: 'Elda' }),
            };
            const policy = mergePolicyFor('custom_table_rows');
            const result = mergeThreeWay(
                row,
                { ...row, data: JSON.stringify({ nombre: 'Ana', edad: 31, ciudad: 'Elda' }) },
                { ...row, data: JSON.stringify({ nombre: 'Ana', edad: 30, ciudad: 'Petrer' }) },
                policy,
            );
            expect(result.conflicts).toEqual([]);
            expect(JSON.parse(String(result.merged.data))).toEqual({
                nombre: 'Ana',
                edad: 31,
                ciudad: 'Petrer',
            });
        });

        it('dos ediciones de la misma celda sí chocan', () => {
            const row = { id: 'r1', data: JSON.stringify({ edad: 30 }) };
            const result = mergeThreeWay(
                row,
                { ...row, data: JSON.stringify({ edad: 31 }) },
                { ...row, data: JSON.stringify({ edad: 32 }) },
                mergePolicyFor('custom_table_rows'),
            );
            expect(result.conflicts).toEqual(['data']);
        });

        it('la fecha de la última nota gana la mayor', () => {
            const row = { id: 'b', last_note_at: '2026-01-01' };
            const result = mergeThreeWay(
                row,
                { ...row, last_note_at: '2026-05-01' },
                { ...row, last_note_at: '2026-03-01' },
                mergePolicyFor('believers'),
            );
            expect(result.conflicts).toEqual([]);
            expect(result.merged.last_note_at).toBe('2026-05-01');
        });

        it('un campo derivado sigue al lado del que se tomó su fuente', () => {
            const row = {
                id: 'b',
                first_name: 'Ana',
                last_name: 'Pérez',
                search_name: 'ana perez',
            };
            const result = mergeThreeWay(
                row,
                { ...row },
                { ...row, first_name: 'Anita', search_name: 'anita perez' },
                mergePolicyFor('believers'),
            );
            expect(result.merged).toMatchObject({
                first_name: 'Anita',
                search_name: 'anita perez',
            });
            expect(result.conflicts).toEqual([]);
        });

        it('sin política, la regla general no inventa ningún atajo', () => {
            const result = mergeThreeWay(
                { id: 'x', position: 1 },
                { id: 'x', position: 2 },
                { id: 'x', position: 3 },
                EMPTY_POLICY,
            );
            expect(result.conflicts).toEqual(['position']);
        });
    });
});
