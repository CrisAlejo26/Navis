import { describe, expect, it } from 'vitest';

import {
    decodeTableFilters,
    decodeTableSorts,
    encodeTableFilters,
    encodeTableSorts,
    type TableColumnRef,
} from './table-state-codec';
import { isTableFilterValue, operatorFitsKind } from './table-state';

const columns: TableColumnRef[] = [
    { id: 'name', kind: 'text' },
    { id: 'age', kind: 'number' },
    { id: 'born', kind: 'date' },
    { id: 'status', kind: 'select' },
];

describe('valores de filtro', () => {
    it('acepta la forma que pide cada operador y rechaza el resto', () => {
        expect(isTableFilterValue('contains', 'ana')).toBe(true);
        expect(isTableFilterValue('contains', '   ')).toBe(false);
        expect(isTableFilterValue('between', { min: 3 })).toBe(true);
        expect(isTableFilterValue('between', {})).toBe(false);
        expect(isTableFilterValue('between', { from: '2026-09-01' })).toBe(true);
        expect(isTableFilterValue('between', { from: '01/09/2026' })).toBe(false);
        expect(isTableFilterValue('in', [])).toBe(false);
        expect(isTableFilterValue('in', ['a'])).toBe(true);
        expect(isTableFilterValue('isEmpty', undefined)).toBe(true);
        expect(isTableFilterValue('isEmpty', 'x')).toBe(false);
    });

    it('reparte los operadores por tipo de columna', () => {
        expect(operatorFitsKind('startsWith', 'text')).toBe(true);
        expect(operatorFitsKind('startsWith', 'number')).toBe(false);
        expect(operatorFitsKind('is', 'boolean')).toBe(true);
    });
});

describe('filtros en la URL', () => {
    it('ida y vuelta sin perder nada', () => {
        const filters = [
            { columnId: 'name', operator: 'contains' as const, value: 'ana' },
            { columnId: 'status', operator: 'in' as const, value: ['a', 'b'] },
        ];
        expect(decodeTableFilters(encodeTableFilters(filters), columns)).toEqual(filters);
    });

    it('sin filtros no escribe nada', () => {
        expect(encodeTableFilters([])).toBe('');
        expect(decodeTableFilters(null, columns)).toEqual([]);
    });

    it('descarta lo inválido en vez de romper', () => {
        const raw = JSON.stringify([
            { columnId: 'borrada', operator: 'contains', value: 'x' },
            { columnId: 'age', operator: 'contains', value: 'x' },
            { columnId: 'age', operator: 'gt', value: 'no-es-número' },
            { columnId: 'age', operator: 'gt', value: 18 },
            'basura',
        ]);
        expect(decodeTableFilters(raw, columns)).toEqual([
            { columnId: 'age', operator: 'gt', value: 18 },
        ]);
        expect(decodeTableFilters('{no es json', columns)).toEqual([]);
        expect(decodeTableFilters('{"a":1}', columns)).toEqual([]);
    });
});

describe('orden en la URL', () => {
    it('ida y vuelta con varios criterios', () => {
        const sorts = [
            { columnId: 'name', dir: 'asc' as const },
            { columnId: 'age', dir: 'desc' as const },
        ];
        expect(decodeTableSorts(encodeTableSorts(sorts), ['name', 'age'])).toEqual(sorts);
    });

    it('descarta columnas no ordenables, sentidos raros y repetidas, y recorta a tres', () => {
        const raw = 'x:asc,name:up,name:asc,name:desc,a:asc,b:asc,c:asc';
        expect(decodeTableSorts(raw, ['name', 'a', 'b', 'c'])).toEqual([
            { columnId: 'name', dir: 'asc' },
            { columnId: 'a', dir: 'asc' },
            { columnId: 'b', dir: 'asc' },
        ]);
    });
});
