import { describe, expect, it } from 'vitest';

import type { TableRequest } from '@/lib/data-table/types';

import { toUsersQuery } from './users-query';

const base: TableRequest = { page: 2, limit: 25, search: '', sorts: [], filters: [] };

describe('toUsersQuery', () => {
    it('sin nada puesto pide la página con el orden de siempre y sin filtros', () => {
        expect(toUsersQuery(base)).toEqual({
            page: 2,
            limit: 25,
            search: undefined,
            roles: undefined,
            churchIds: undefined,
            sort: 'createdAt',
            order: 'desc',
        });
    });

    it('lleva la búsqueda, el primer criterio de orden y los filtros de rol e iglesia', () => {
        const query = toUsersQuery({
            ...base,
            search: 'ana',
            sorts: [
                { columnId: 'name', dir: 'asc' },
                { columnId: 'email', dir: 'desc' },
            ],
            filters: [
                { columnId: 'role', operator: 'in', value: ['pastor', 'sonido'] },
                { columnId: 'church', operator: 'in', value: ['c1'] },
            ],
        });
        expect(query).toMatchObject({
            search: 'ana',
            sort: 'name',
            order: 'asc',
            roles: ['pastor', 'sonido'],
            churchIds: ['c1'],
        });
    });

    it('descarta lo que la API no entiende: otro operador o una columna que no ordena', () => {
        const query = toUsersQuery({
            ...base,
            sorts: [{ columnId: 'church', dir: 'asc' }],
            filters: [{ columnId: 'role', operator: 'notIn', value: ['pastor'] }],
        });
        expect(query.roles).toBeUndefined();
        expect(query.sort).toBe('createdAt');
    });
});
