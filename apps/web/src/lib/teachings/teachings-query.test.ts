import { describe, expect, it } from 'vitest';

import type { TableRequest } from '@/lib/data-table/types';

import { toTeachingsQuery } from './teachings-query';

const base: TableRequest = { page: 3, limit: 25, search: '', sorts: [], filters: [] };

describe('toTeachingsQuery', () => {
    it('sin nada puesto pide por fecha de recepción hacia atrás', () => {
        expect(toTeachingsQuery(base)).toEqual({
            page: 3,
            limit: 25,
            search: undefined,
            sort: 'received',
            order: 'desc',
        });
    });

    it('lleva la búsqueda y el primer criterio de orden; una columna que no ordena cae al de siempre', () => {
        expect(
            toTeachingsQuery({ ...base, search: 'fe', sorts: [{ columnId: 'title', dir: 'asc' }] }),
        ).toMatchObject({ search: 'fe', sort: 'title', order: 'asc' });
        expect(
            toTeachingsQuery({ ...base, sorts: [{ columnId: 'checklist', dir: 'asc' }] }).sort,
        ).toBe('received');
    });
});
