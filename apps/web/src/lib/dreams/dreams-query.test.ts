import { describe, expect, it } from 'vitest';

import type { TableRequest } from '@/lib/data-table/types';

import { dreamFiltersFromLegacy, dreamRange, toDreamsQuery } from './dreams-query';

const base: TableRequest = { page: 1, limit: 10, search: '', sorts: [], filters: [] };

describe('toDreamsQuery', () => {
    it('sin nada puesto pide por noche hacia atrás y sin filtros', () => {
        expect(toDreamsQuery(base)).toMatchObject({
            sort: 'dreamed',
            order: 'desc',
            state: undefined,
            emotion: undefined,
            from: undefined,
            to: undefined,
        });
    });

    it('lleva estados, emociones, el tramo de noches y la primera columna de orden', () => {
        const query = toDreamsQuery({
            ...base,
            search: 'mar',
            sorts: [{ columnId: 'title', dir: 'asc' }],
            filters: [
                { columnId: 'state', operator: 'in', value: ['cumplido', 'nope'] },
                { columnId: 'emotions', operator: 'in', value: ['paz'] },
                { columnId: 'dreamed', operator: 'between', value: { from: '2026-08-01' } },
            ],
        });
        expect(query).toMatchObject({
            search: 'mar',
            sort: 'title',
            order: 'asc',
            state: ['cumplido'],
            emotion: ['paz'],
            from: '2026-08-01',
            to: undefined,
        });
    });

    it('una columna que la API no ordena cae al orden de siempre', () => {
        expect(toDreamsQuery({ ...base, sorts: [{ columnId: 'emotions', dir: 'asc' }] }).sort).toBe(
            'dreamed',
        );
    });
});

describe('enlaces de antes', () => {
    it('traduce estado, emoción y noche a filtros de la tabla', () => {
        const filters = dreamFiltersFromLegacy(
            new URLSearchParams('state=estudio&emotion=a&emotion=b&from=2026-08-04&to=2026-08-04'),
        );
        expect(filters).toEqual([
            { columnId: 'state', operator: 'in', value: ['estudio'] },
            { columnId: 'emotions', operator: 'in', value: ['a', 'b'] },
            {
                columnId: 'dreamed',
                operator: 'between',
                value: { from: '2026-08-04', to: '2026-08-04' },
            },
        ]);
        expect(dreamRange(filters)).toEqual({ from: '2026-08-04', to: '2026-08-04' });
    });

    it('un estado que no existe se descarta', () => {
        expect(dreamFiltersFromLegacy(new URLSearchParams('state=raro'))).toEqual([]);
    });
});
