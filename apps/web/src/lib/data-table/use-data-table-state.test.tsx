import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { MemoryRouter, useLocation } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { tablePreferencesKey } from './storage-keys';
import type { TableColumnSpec } from './types';
import { useDataTableState } from './use-data-table-state';

const session: { userId: string | undefined } = vi.hoisted(() => ({ userId: 'u1' }));
vi.mock('@/lib/auth-client', () => ({
    useSession: () => ({ data: session.userId ? { user: { id: session.userId } } : null }),
}));

const columns: TableColumnSpec[] = [
    { id: 'name', kind: 'text' },
    { id: 'age', kind: 'number' },
    { id: 'status', kind: 'select' },
];

function mount(url = '/tabla') {
    const wrapper = ({ children }: { children: ReactNode }) => (
        <MemoryRouter initialEntries={[url]}>{children}</MemoryRouter>
    );
    return renderHook(
        () => ({ state: useDataTableState('demo', columns), search: useLocation().search }),
        { wrapper },
    );
}

describe('useDataTableState', () => {
    beforeEach(() => {
        localStorage.clear();
        session.userId = 'u1';
    });

    it('sin URL ni preferencias pide la primera página de 10 sin filtros', () => {
        const { result } = mount();
        expect(result.current.state.request).toEqual({
            page: 1,
            limit: 10,
            search: '',
            sorts: [],
            filters: [],
        });
    });

    it('la URL manda sobre las preferencias, y las preferencias sobre lo de fábrica', () => {
        localStorage.setItem(
            tablePreferencesKey('u1', 'demo'),
            JSON.stringify({
                v: 1,
                columnVisibility: {},
                columnOrder: [],
                pageSize: 50,
                density: 'normal',
                sorts: [{ columnId: 'name', dir: 'asc' }],
            }),
        );

        const saved = mount();
        expect(saved.result.current.state.request.limit).toBe(50);
        expect(saved.result.current.state.request.sorts).toEqual([
            { columnId: 'name', dir: 'asc' },
        ]);

        const linked = mount('/tabla?limit=25&sort=age:desc');
        expect(linked.result.current.state.request.limit).toBe(25);
        expect(linked.result.current.state.request.sorts).toEqual([
            { columnId: 'age', dir: 'desc' },
        ]);
    });

    it('ignora lo inválido de la URL en vez de romper', () => {
        const { result } = mount('/tabla?limit=7&page=-3&sort=borrada:asc&f=basura');
        expect(result.current.state.request).toMatchObject({
            page: 1,
            limit: 10,
            sorts: [],
            filters: [],
        });
    });

    it('entiende los enlaces antiguos con sort y order sueltos', () => {
        const { result } = mount('/tabla?sort=name&order=asc');
        expect(result.current.state.request.sorts).toEqual([{ columnId: 'name', dir: 'asc' }]);
    });

    // Regresión de la regla de TanStack: el 7 de los resultados de antes no existe
    // en los de ahora, así que cualquier cambio de criterio vuelve a la primera.
    it('cambiar búsqueda, orden o filtros vuelve a la primera página', () => {
        const { result } = mount('/tabla?page=4');
        expect(result.current.state.request.page).toBe(4);

        act(() => {
            result.current.state.setSearch('ana');
        });
        expect(result.current.state.request).toMatchObject({ page: 1, search: 'ana' });

        act(() => {
            result.current.state.setPage(3);
        });
        act(() => {
            result.current.state.toggleSort('name');
        });
        expect(result.current.state.request).toMatchObject({
            page: 1,
            sorts: [{ columnId: 'name', dir: 'asc' }],
        });
        expect(result.current.search).toContain('sort=name%3Aasc');

        act(() => {
            result.current.state.setPage(2);
        });
        act(() => {
            result.current.state.setFilters([{ columnId: 'age', operator: 'gt', value: 18 }]);
        });
        expect(result.current.state.request.page).toBe(1);
        expect(result.current.state.request.filters).toEqual([
            { columnId: 'age', operator: 'gt', value: 18 },
        ]);

        act(() => {
            result.current.state.clearFilters();
        });
        expect(result.current.state.request.filters).toEqual([]);
        expect(result.current.search).not.toContain('f=');
    });

    it('elegir tamaño de página lo guarda como preferencia y quita el de la URL', () => {
        const { result } = mount('/tabla?limit=25&page=3');

        act(() => {
            result.current.state.setLimit(50);
        });

        expect(result.current.state.request).toMatchObject({ limit: 50, page: 1 });
        expect(result.current.search).not.toContain('limit');
        expect(
            JSON.parse(localStorage.getItem(tablePreferencesKey('u1', 'demo')) ?? '{}'),
        ).toMatchObject({ pageSize: 50 });
    });

    it('las preferencias son de cada usuario', () => {
        const first = mount();
        act(() => {
            first.result.current.state.setLimit(100);
        });

        session.userId = 'u2';
        const second = mount();
        expect(second.result.current.state.request.limit).toBe(10);

        // Sin sesión (modo local) van a su propio saco, no al de nadie.
        session.userId = undefined;
        const local = mount();
        act(() => {
            local.result.current.state.setLimit(20);
        });
        expect(localStorage.getItem('navis.table.local.demo.prefs')).toContain('"pageSize":20');
        expect(JSON.parse(localStorage.getItem('navis.table.u1.demo.prefs') ?? '{}')).toMatchObject(
            {
                pageSize: 100,
            },
        );
    });

    it('guardar columnas visibles y restablecer', () => {
        const { result } = mount();

        act(() => {
            result.current.state.updatePreferences({
                columnVisibility: { name: true, age: false, status: true },
            });
        });
        expect(result.current.state.preferences.columnVisibility.age).toBe(false);

        act(() => {
            result.current.state.resetPreferences();
        });
        expect(result.current.state.preferences.columnVisibility.age).toBe(true);
    });

    // Lo que la persona deja puesto no se rehace cada vez que vuelve a la pantalla.
    describe('recordar lo último', () => {
        const age = { columnId: 'age', operator: 'gt' as const, value: 18 };

        it('el orden y los filtros vuelven al abrir la tabla sin enlace', () => {
            const first = mount();
            act(() => {
                first.result.current.state.toggleSort('name');
            });
            act(() => {
                first.result.current.state.setFilters([age]);
            });
            first.unmount();

            const again = mount();
            expect(again.result.current.state.request.sorts).toEqual([
                { columnId: 'name', dir: 'asc' },
            ]);
            expect(again.result.current.state.request.filters).toEqual([age]);
        });

        it('quitar los filtros también se recuerda: no resucitan los de la última vez', () => {
            const first = mount();
            act(() => {
                first.result.current.state.setFilters([age]);
            });
            act(() => {
                first.result.current.state.clearFilters();
            });
            first.unmount();

            expect(mount().result.current.state.request.filters).toEqual([]);
        });

        it('un enlace con filtros manda sobre lo guardado', () => {
            const first = mount();
            act(() => {
                first.result.current.state.setFilters([age]);
            });
            first.unmount();

            const f = encodeURIComponent(
                JSON.stringify([{ columnId: 'name', operator: 'contains', value: 'ana' }]),
            );
            const linked = mount(`/tabla?f=${f}`);
            expect(linked.result.current.state.request.filters).toEqual([
                { columnId: 'name', operator: 'contains', value: 'ana' },
            ]);
        });

        // Regresión: guardar filtros sin validarlos rompía la tabla el día que se
        // quitaba una columna, y con ella los filtros ya guardados sobre ella.
        it('descarta lo guardado sobre una columna que ya no existe', () => {
            localStorage.setItem(
                tablePreferencesKey('u1', 'demo'),
                JSON.stringify({
                    v: 1,
                    columnVisibility: {},
                    columnOrder: [],
                    pageSize: 10,
                    density: 'normal',
                    sorts: [],
                    filters: [{ columnId: 'borrada', operator: 'contains', value: 'x' }, age],
                }),
            );
            expect(mount().result.current.state.request.filters).toEqual([age]);
        });
    });
});
