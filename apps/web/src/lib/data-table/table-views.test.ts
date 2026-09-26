import { describe, expect, it } from 'vitest';

import { MAX_SAVED_VIEWS, parsePreferences, type SavedTableView } from './table-preferences';
import { activeView, withSavedView, type ViewSnapshot } from './table-views';
import type { TableColumnSpec } from './types';

const columns: TableColumnSpec[] = [
    { id: 'name', kind: 'text', hideable: false },
    { id: 'age', kind: 'number' },
    { id: 'status', kind: 'select' },
];

const snapshot: ViewSnapshot = {
    filters: [{ columnId: 'age', operator: 'gt', value: 18 }],
    sorts: [{ columnId: 'name', dir: 'asc' }],
    columnVisibility: { name: true, age: true, status: false },
    columnOrder: ['name', 'age', 'status'],
};

let counter = 0;
const newId = () => `v${++counter}`;

describe('vistas guardadas', () => {
    it('guarda el estado actual con su nombre', () => {
        const views = withSavedView([], '  Pendientes  ', snapshot, newId);
        expect(views).toHaveLength(1);
        expect(views?.[0]).toMatchObject({ name: 'Pendientes', filters: snapshot.filters });
    });

    it('sin nombre no hay vista', () => {
        expect(withSavedView([], '   ', snapshot, newId)).toBeNull();
    });

    it('guardar otra vez con el mismo nombre la sustituye, no la duplica', () => {
        const first = withSavedView([], 'Pendientes', snapshot, newId) ?? [];
        const second = withSavedView(first, 'pendientes', { ...snapshot, sorts: [] }, newId) ?? [];
        expect(second).toHaveLength(1);
        expect(second[0]?.id).toBe(first[0]?.id);
        expect(second[0]?.sorts).toEqual([]);
    });

    it('al llegar al tope no admite otra, pero sí reescribir una que ya existe', () => {
        const full: SavedTableView[] = Array.from({ length: MAX_SAVED_VIEWS }, (_, index) => ({
            id: `id${index}`,
            name: `Vista ${index}`,
            filters: [],
            sorts: [],
            columnVisibility: {},
            columnOrder: [],
        }));
        expect(withSavedView(full, 'Otra más', snapshot, newId)).toBeNull();
        expect(withSavedView(full, 'Vista 3', snapshot, newId)).toHaveLength(MAX_SAVED_VIEWS);
    });

    it('reconoce la vista activa aunque las claves vengan en otro orden', () => {
        const views = withSavedView([], 'Pendientes', snapshot, newId) ?? [];
        expect(
            activeView(views, {
                ...snapshot,
                columnVisibility: { status: false, age: true, name: true },
            })?.name,
        ).toBe('Pendientes');
        expect(activeView(views, { ...snapshot, filters: [] })).toBeUndefined();
    });

    // Regresión: una vista con un filtro sobre una columna borrada dejaba la tabla
    // rota al aplicarla.
    it('al leerlas de disco se ponen al día con las columnas de hoy', () => {
        const stored = {
            v: 1,
            columnVisibility: {},
            columnOrder: [],
            pageSize: 10,
            density: 'normal',
            sorts: [],
            views: [
                {
                    id: 'v',
                    name: 'Vieja',
                    filters: [
                        { columnId: 'borrada', operator: 'contains', value: 'x' },
                        { columnId: 'age', operator: 'gt', value: 1 },
                    ],
                    sorts: [{ columnId: 'borrada', dir: 'asc' }],
                    columnVisibility: { status: false, borrada: false },
                    columnOrder: ['status', 'borrada'],
                },
            ],
        };
        const view = parsePreferences(JSON.stringify(stored), columns).views[0];
        expect(view?.filters).toEqual([{ columnId: 'age', operator: 'gt', value: 1 }]);
        expect(view?.columnOrder).toEqual(['status', 'name', 'age']);
        expect(view?.columnVisibility).toEqual({ name: true, age: true, status: false });
    });

    it('unas preferencias antiguas, sin vistas, siguen valiendo', () => {
        const old = {
            v: 1,
            columnVisibility: {},
            columnOrder: [],
            pageSize: 10,
            density: 'normal',
            sorts: [],
        };
        expect(parsePreferences(JSON.stringify(old), columns).views).toEqual([]);
    });
});
