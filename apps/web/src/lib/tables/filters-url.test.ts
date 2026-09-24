import { describe, expect, it } from 'vitest';

import type { CustomTableColumn, RowFilter } from '@navis/shared';

import { operatorFor, parseUrlFilters } from '@/lib/tables/filters-url';

const COLUMNS: CustomTableColumn[] = [
    base('texto', 'text'),
    base('numero', 'number'),
    base('fecha', 'date'),
    base('casilla', 'checkbox'),
    base('seleccion', 'single_select'),
    base('secreto', 'password'),
];

function base(key: string, type: CustomTableColumn['type']): CustomTableColumn {
    return {
        id: key,
        tableId: 't1',
        key,
        label: key,
        type,
        position: 0,
        required: false,
        options: null,
        config: null,
        isActive: true,
    };
}

describe('el operador que le toca a cada tipo', () => {
    it('reparte igual que la API: contiene para texto, entre para número y fecha', () => {
        expect(operatorFor('text')).toBe('contains');
        expect(operatorFor('email')).toBe('contains');
        expect(operatorFor('number')).toBe('between');
        expect(operatorFor('currency')).toBe('between');
        expect(operatorFor('date')).toBe('between');
        expect(operatorFor('checkbox')).toBe('equals');
        expect(operatorFor('single_select')).toBe('in');
        expect(operatorFor('multi_select')).toBe('in');
    });

    it('la contraseña no se puede filtrar (D29)', () => {
        expect(operatorFor('password')).toBeUndefined();
    });
});

describe('lo que llega por la URL se valida antes de usarse', () => {
    it('un filtro válido sobrevive al viaje', () => {
        const filters: RowFilter[] = [
            { columnKey: 'texto', operator: 'contains', value: 'ana' },
            { columnKey: 'numero', operator: 'between', value: { min: 1, max: 5 } },
        ];

        expect(parseUrlFilters(JSON.stringify(filters), COLUMNS)).toEqual(filters);
    });

    it('sin parámetro, sin filtros', () => {
        expect(parseUrlFilters(undefined, COLUMNS)).toEqual([]);
        expect(parseUrlFilters(null, COLUMNS)).toEqual([]);
    });

    it('un texto que no es JSON no rompe la pantalla', () => {
        expect(parseUrlFilters('{"columnKey:', COLUMNS)).toEqual([]);
    });

    it('un filtro de una columna que ya no existe se descarta', () => {
        const raw = JSON.stringify([{ columnKey: 'borrada', operator: 'contains', value: 'x' }]);

        expect(parseUrlFilters(raw, COLUMNS)).toEqual([]);
    });

    it('un operador que no le corresponde al tipo se descarta (D30)', () => {
        const raw = JSON.stringify([
            { columnKey: 'numero', operator: 'contains', value: 'x' },
            { columnKey: 'texto', operator: 'in', value: ['x'] },
            { columnKey: 'texto', operator: 'contains', value: 'ok' },
        ]);

        expect(parseUrlFilters(raw, COLUMNS)).toEqual([
            { columnKey: 'texto', operator: 'contains', value: 'ok' },
        ]);
    });

    it('la contraseña no se puede colar ni con su operador bueno (D29)', () => {
        const raw = JSON.stringify([{ columnKey: 'secreto', operator: 'contains', value: 'x' }]);

        expect(parseUrlFilters(raw, COLUMNS)).toEqual([]);
    });
});
