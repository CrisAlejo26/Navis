import { describe, expect, it } from 'vitest';

import type { TableRequest } from '@/lib/data-table/types';

import { believerFiltersFromLegacy, toBelieversQuery } from './believers-query';

const base: TableRequest = { page: 1, limit: 10, search: '', sorts: [], filters: [] };

describe('toBelieversQuery', () => {
    it('sin nada puesto ordena por nombre y no filtra', () => {
        expect(toBelieversQuery(base)).toMatchObject({
            sort: 'name',
            order: 'asc',
            status: undefined,
            attention: undefined,
        });
    });

    it('lleva estados, sede, don, etiqueta, lista, «en N listas» y atención', () => {
        const query = toBelieversQuery({
            ...base,
            sorts: [{ columnId: 'lastNote', dir: 'desc' }],
            filters: [
                { columnId: 'status', operator: 'in', value: ['activo', 'raro'] },
                { columnId: 'congregation', operator: 'in', value: ['c1'] },
                { columnId: 'gifts', operator: 'in', value: ['g1', 'g2'] },
                { columnId: 'tag', operator: 'in', value: ['t1'] },
                { columnId: 'list', operator: 'in', value: ['l1'] },
                { columnId: 'inLists', operator: 'equals', value: 4 },
                { columnId: 'attention', operator: 'in', value: ['true'] },
            ],
        });
        expect(query).toMatchObject({
            status: ['activo'],
            congregationId: 'c1',
            giftId: 'g1',
            tagId: 't1',
            listId: 'l1',
            inLists: 4,
            attention: true,
            sort: 'lastNote',
            order: 'desc',
        });
    });

    it('«atención: no» no filtra y un orden desconocido cae al de nombre', () => {
        const query = toBelieversQuery({
            ...base,
            sorts: [{ columnId: 'phone', dir: 'desc' }],
            filters: [{ columnId: 'attention', operator: 'in', value: ['false'] }],
        });
        expect(query.attention).toBeUndefined();
        expect(query.sort).toBe('name');
    });
});

describe('believerFiltersFromLegacy', () => {
    it('traduce los enlaces de la portada y de las listas', () => {
        const filters = believerFiltersFromLegacy(
            new URLSearchParams('attention=true&inLists=4&status=nuevo&giftId=g1'),
        );
        expect(filters).toEqual(
            expect.arrayContaining([
                { columnId: 'attention', operator: 'in', value: ['true'] },
                { columnId: 'inLists', operator: 'equals', value: 4 },
                { columnId: 'status', operator: 'in', value: ['nuevo'] },
                { columnId: 'gifts', operator: 'in', value: ['g1'] },
            ]),
        );
    });
});
