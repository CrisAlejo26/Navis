import type { CustomTableColumn } from '@navis/shared';
import { describe, expect, it } from 'vitest';

import type { TableRequest } from '@/lib/data-table/types';

import { columnSpec, toRowFilters, toRowsQuery } from './row-columns';

const base: TableRequest = { page: 1, limit: 10, search: '', sorts: [], filters: [] };

const column = (key: string, type: CustomTableColumn['type']): CustomTableColumn =>
    ({ key, type, label: key }) as CustomTableColumn;

describe('columnSpec', () => {
    it('cada tipo admite solo el filtro que entiende la API', () => {
        expect(columnSpec(column('a', 'text'))).toMatchObject({
            kind: 'text',
            operators: ['contains'],
        });
        expect(columnSpec(column('a', 'currency'))).toMatchObject({
            kind: 'number',
            operators: ['between'],
        });
        expect(columnSpec(column('a', 'date'))).toMatchObject({
            kind: 'date',
            operators: ['between'],
        });
        expect(columnSpec(column('a', 'checkbox'))).toMatchObject({
            kind: 'boolean',
            operators: ['is'],
        });
        expect(columnSpec(column('a', 'multi_select'))).toMatchObject({
            kind: 'select',
            operators: ['in'],
        });
    });

    it('la contraseña no se filtra ni se ordena (D29)', () => {
        expect(columnSpec(column('secreto', 'password'))).toMatchObject({
            sortable: false,
            filterable: false,
        });
    });
});

describe('toRowFilters', () => {
    it('traduce la casilla «es» a «equals» y deja el resto con su nombre', () => {
        expect(
            toRowFilters([
                { columnId: 'activo', operator: 'is', value: false },
                { columnId: 'precio', operator: 'between', value: { min: 1 } },
                { columnId: 'estado', operator: 'in', value: ['roto'] },
            ]),
        ).toEqual([
            { columnKey: 'activo', operator: 'equals', value: false },
            { columnKey: 'precio', operator: 'between', value: { min: 1 } },
            { columnKey: 'estado', operator: 'in', value: ['roto'] },
        ]);
    });
});

describe('toRowsQuery', () => {
    const columns = [column('nombre', 'text'), column('secreto', 'password')];

    it('sin orden pide lo más reciente y sin filtros no manda nada', () => {
        expect(toRowsQuery(base, columns)).toMatchObject({
            sort: undefined,
            order: 'desc',
            filters: undefined,
        });
    });

    it('ordena por una columna real y descarta la contraseña o una que ya no existe', () => {
        expect(
            toRowsQuery({ ...base, sorts: [{ columnId: 'nombre', dir: 'asc' }] }, columns),
        ).toMatchObject({ sort: 'nombre', order: 'asc' });
        expect(
            toRowsQuery({ ...base, sorts: [{ columnId: 'secreto', dir: 'asc' }] }, columns).sort,
        ).toBeUndefined();
    });
});
