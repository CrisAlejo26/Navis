import { describe, expect, it } from 'vitest';

import {
    boundColumnsOf,
    boundValue,
    overlayBoundRow,
    type BelieverSource,
} from './table-believer-overlay';
import type { CustomTableRow as CustomTableRowView } from '@navis/shared';

const creyente: BelieverSource = {
    id: 'b1',
    firstName: 'Juan Carlos',
    lastName: 'Ruiz',
    phone: '+57 300 000 0000',
    email: 'juan@example.com',
    status: 'activo',
    congregationId: 'c1',
    arrivedAt: '2026-08-01',
    lastNoteAt: null,
    arrivalSite: null,
    bibleReadings: 3,
    vivenciasReadings: null,
    bibleInstituteTimes: 1,
    photoKey: 'foto.jpg',
};

describe('boundValue', () => {
    it('el nombre completo recorta el apellido vacío', () => {
        expect(boundValue('fullName', creyente, null)).toBe('Juan Carlos Ruiz');
        expect(boundValue('fullName', { ...creyente, lastName: '' }, null)).toBe('Juan Carlos');
    });

    it('las fechas vuelven día de calendario y los nulos quedan nulos', () => {
        expect(boundValue('arrivedAt', creyente, null)).toBe('2026-08-01');
        expect(boundValue('lastNoteAt', creyente, null)).toBeNull();
    });

    it('la sede es el nombre, no el identificador', () => {
        expect(boundValue('congregation', creyente, 'El Centro')).toBe('El Centro');
        expect(boundValue('congregation', creyente, null)).toBeNull();
    });
});

describe('overlayBoundRow', () => {
    const view = {
        id: 'r1',
        tableId: 't1',
        data: { telefono: 'viejo' },
        mismatches: [],
        believerId: 'b1',
        believer: null,
        createdBy: null,
        createdAt: '',
        updatedAt: '',
    };

    it('escribe el valor vivo bajo la key de cada columna vinculada (D11)', () => {
        const resuelto = overlayBoundRow(
            { ...view, data: { ...view.data } },
            [
                { key: 'telefono', believerField: 'phone' },
                { key: 'correo', believerField: 'email' },
            ],
            creyente,
            null,
        );
        expect(resuelto.data.telefono).toBe('+57 300 000 0000');
        expect(resuelto.data.correo).toBe('juan@example.com');
    });

    it('los valores escritos a mano antes de vincular no se borran del JSON (D6)', () => {
        expect(view.data.telefono).toBe('viejo');
    });

    // Regresión (D7): sin creyente, la celda vinculada se ve vacía y no enseña
    // lo que se escribió a mano antes de vincular.
    it('sin creyente la celda vinculada queda vacía, y el JSON original no se toca', () => {
        const original = { ...view, data: { telefono: 'viejo' } };
        const resuelto = overlayBoundRow(
            { ...original, data: { ...original.data } },
            [{ key: 'telefono', believerField: 'phone' }],
            null,
            null,
        );
        expect(resuelto.data.telefono).toBeNull();
        expect(original.data.telefono).toBe('viejo');
    });

    it('boundColumnsOf deja solo las que tienen campo', () => {
        expect(
            boundColumnsOf([
                { key: 'a', believerField: 'phone' } as never,
                { key: 'b', believerField: null } as never,
            ]),
        ).toHaveLength(1);
    });
});
