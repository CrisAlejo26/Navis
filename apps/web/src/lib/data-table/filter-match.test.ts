import type { TableFilter } from '@navis/shared';
import { describe, expect, it } from 'vitest';

import type { DataTableColumn } from './columns';
import { applyClientFilters, applyClientSearch, matchesTableFilter } from './filter-match';

const f = (operator: TableFilter['operator'], value?: unknown): TableFilter => ({
    columnId: 'x',
    operator,
    value,
});

describe('matchesTableFilter', () => {
    it('texto: contiene sin importar mayúsculas ni acentos', () => {
        expect(matchesTableFilter(f('contains', 'pulpito'), 'Púlpito', 'text')).toBe(true);
        expect(matchesTableFilter(f('contains', 'sonido'), 'Púlpito', 'text')).toBe(false);
        expect(matchesTableFilter(f('startsWith', 'pú'), 'Púlpito', 'text')).toBe(true);
        expect(matchesTableFilter(f('startsWith', 'lpito'), 'Púlpito', 'text')).toBe(false);
        expect(matchesTableFilter(f('equals', 'PÚLPITO'), 'Púlpito', 'text')).toBe(true);
    });

    it('número: igual, mayor, menor y entre (con un solo extremo)', () => {
        expect(matchesTableFilter(f('equals', 2), 2, 'number')).toBe(true);
        expect(matchesTableFilter(f('gt', 2), 2, 'number')).toBe(false);
        expect(matchesTableFilter(f('gt', 1), 2, 'number')).toBe(true);
        expect(matchesTableFilter(f('lt', 3), 2, 'number')).toBe(true);
        expect(matchesTableFilter(f('between', { min: 2, max: 4 }), 4, 'number')).toBe(true);
        expect(matchesTableFilter(f('between', { min: 5 }), 4, 'number')).toBe(false);
        expect(matchesTableFilter(f('between', { max: 5 }), 4, 'number')).toBe(true);
    });

    it('fecha: compara el día aunque la celda traiga la hora', () => {
        expect(matchesTableFilter(f('on', '2026-09-24'), '2026-09-24T18:30:00Z', 'date')).toBe(
            true,
        );
        expect(matchesTableFilter(f('before', '2026-09-24'), '2026-09-23', 'date')).toBe(true);
        expect(matchesTableFilter(f('after', '2026-09-24'), '2026-09-24', 'date')).toBe(false);
        expect(
            matchesTableFilter(
                f('between', { from: '2026-09-01', to: '2026-09-30' }),
                '2026-09-30',
                'date',
            ),
        ).toBe(true);
        expect(matchesTableFilter(f('between', { from: '2026-10-01' }), '2026-09-30', 'date')).toBe(
            false,
        );
    });

    it('selección: es uno de / no es', () => {
        expect(matchesTableFilter(f('in', ['a', 'b']), 'a', 'select')).toBe(true);
        expect(matchesTableFilter(f('in', ['a', 'b']), 'c', 'select')).toBe(false);
        expect(matchesTableFilter(f('notIn', ['a']), 'c', 'select')).toBe(true);
        expect(matchesTableFilter(f('notIn', ['a']), null, 'select')).toBe(true);
    });

    it('booleano y vacíos', () => {
        expect(matchesTableFilter(f('is', true), true, 'boolean')).toBe(true);
        expect(matchesTableFilter(f('is', true), false, 'boolean')).toBe(false);
        expect(matchesTableFilter(f('isEmpty'), '', 'text')).toBe(true);
        expect(matchesTableFilter(f('isEmpty'), 0, 'number')).toBe(false);
        expect(matchesTableFilter(f('isNotEmpty'), 'x', 'text')).toBe(true);
        expect(matchesTableFilter(f('contains', 'x'), null, 'text')).toBe(false);
    });
});

describe('applyClientSearch', () => {
    const rows = [
        { name: 'Púlpito', note: 'x' },
        { name: 'Sonido', note: 'pastor' },
    ];
    const columns: DataTableColumn<(typeof rows)[number]>[] = [
        { id: 'name', kind: 'text', label: 'N', value: (r) => r.name, cell: (r) => r.name },
        {
            id: 'note',
            kind: 'text',
            label: 'O',
            searchable: false,
            value: (r) => r.note,
            cell: (r) => r.note,
        },
    ];

    it('ignora mayúsculas y acentos, y pide todas las palabras', () => {
        expect(applyClientSearch(rows, columns, 'PULPI').map((r) => r.name)).toEqual(['Púlpito']);
        expect(applyClientSearch(rows, columns, 'sonido pul')).toHaveLength(0);
        expect(applyClientSearch(rows, columns, '   ')).toBe(rows);
    });

    it('no mira las columnas que no son buscables', () => {
        expect(applyClientSearch(rows, columns, 'pastor')).toHaveLength(0);
    });
});

describe('applyClientFilters', () => {
    interface Row {
        name: string;
        level: number;
    }
    const rows: Row[] = [
        { name: 'Pastor', level: 2 },
        { name: 'Sonido', level: 1 },
        { name: 'Púlpito', level: 1 },
    ];
    const columns: DataTableColumn<Row>[] = [
        { id: 'name', kind: 'text', label: 'Rol', value: (r) => r.name, cell: (r) => r.name },
        {
            id: 'level',
            kind: 'number',
            label: 'Nivel',
            value: (r) => r.level,
            cell: (r) => r.level,
        },
    ];

    it('sin filtros devuelve la misma lista', () => {
        expect(applyClientFilters(rows, columns, [])).toBe(rows);
    });

    it('los filtros se suman, también dos sobre la misma columna', () => {
        const result = applyClientFilters(rows, columns, [
            { columnId: 'level', operator: 'gt', value: 0 },
            { columnId: 'level', operator: 'lt', value: 2 },
            { columnId: 'name', operator: 'contains', value: 'o' },
        ]);
        expect(result.map((row) => row.name)).toEqual(['Sonido', 'Púlpito']);
    });

    it('ignora un filtro sobre una columna sin valor que comparar', () => {
        const result = applyClientFilters(rows, columns, [
            { columnId: 'borrada', operator: 'contains', value: 'zzz' },
        ]);
        expect(result).toHaveLength(3);
    });
});
