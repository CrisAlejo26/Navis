import { beforeEach, describe, expect, it } from 'vitest';

import { readRawPreferences, writeRawPreferences } from './preferences-storage';
import { tablePreferencesKey } from './storage-keys';
import { defaultPreferences, parsePreferences } from './table-preferences';
import { cycleSort, legacySort } from './table-sorting';
import type { TableColumnSpec } from './types';

const columns: TableColumnSpec[] = [
    { id: 'name', kind: 'text', hideable: false },
    { id: 'phone', kind: 'text', defaultVisible: false },
    { id: 'status', kind: 'select' },
    { id: 'actions', kind: 'text', sortable: false, hideable: false },
];

describe('preferencias de tabla', () => {
    it('sin nada guardado, sale lo de fábrica con 10 por página', () => {
        const prefs = parsePreferences(null, columns);
        expect(prefs.pageSize).toBe(10);
        expect(prefs.columnVisibility).toEqual({
            name: true,
            phone: false,
            status: true,
            actions: true,
        });
        expect(prefs.columnOrder).toEqual(['name', 'phone', 'status', 'actions']);
    });

    it('JSON roto, versión vieja o forma inesperada caen a lo de fábrica sin lanzar', () => {
        const fallback = defaultPreferences(columns);
        expect(parsePreferences('{no es json', columns)).toEqual(fallback);
        expect(parsePreferences('{"v":0}', columns)).toEqual(fallback);
        expect(parsePreferences(JSON.stringify({ ...fallback, pageSize: 7 }), columns)).toEqual(
            fallback,
        );
    });

    // Regresión: una columna añadida en una versión nueva se quedaba oculta para
    // quien ya tenía preferencias guardadas, y una borrada dejaba ids fantasma.
    it('reconcilia con las columnas de hoy: la nueva entra visible y la borrada se va', () => {
        const stored = {
            ...defaultPreferences(columns),
            columnOrder: ['status', 'gone', 'name'],
            columnVisibility: { status: false, gone: true, name: true },
        };
        const prefs = parsePreferences(JSON.stringify(stored), columns);

        expect(prefs.columnOrder).toEqual(['status', 'name', 'phone', 'actions']);
        expect(prefs.columnVisibility).toEqual({
            name: true,
            phone: false,
            status: false,
            actions: true,
        });
    });

    it('una columna que no se puede ocultar sale visible aunque lo guardado diga que no', () => {
        const stored = defaultPreferences(columns);
        stored.columnVisibility.name = false;
        expect(parsePreferences(JSON.stringify(stored), columns).columnVisibility.name).toBe(true);
    });

    it('descarta un orden por defecto sobre una columna que ya no se puede ordenar', () => {
        const stored = defaultPreferences(columns);
        stored.sorts = [
            { columnId: 'actions', dir: 'asc' },
            { columnId: 'name', dir: 'desc' },
        ];
        expect(parsePreferences(JSON.stringify(stored), columns).sorts).toEqual([
            { columnId: 'name', dir: 'desc' },
        ]);
    });
});

describe('almacenamiento', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('la clave lleva el usuario y la tabla', () => {
        expect(tablePreferencesKey('u1', 'believers')).toBe('navis.table.u1.believers.prefs');
    });

    it('escribe y lee, y borrar devuelve null', () => {
        writeRawPreferences('k', 'valor');
        expect(readRawPreferences('k')).toBe('valor');
        writeRawPreferences('k', null);
        expect(readRawPreferences('k')).toBeNull();
    });
});

describe('orden al pulsar una cabecera', () => {
    it('recorre ascendente, descendente y sin orden', () => {
        const first = cycleSort([], 'name', false);
        expect(first).toEqual([{ columnId: 'name', dir: 'asc' }]);
        const second = cycleSort(first, 'name', false);
        expect(second).toEqual([{ columnId: 'name', dir: 'desc' }]);
        expect(cycleSort(second, 'name', false)).toEqual([]);
    });

    it('sin Mayús, otra columna sustituye a las demás', () => {
        const current = [{ columnId: 'name', dir: 'asc' as const }];
        expect(cycleSort(current, 'status', false)).toEqual([{ columnId: 'status', dir: 'asc' }]);
    });

    it('con Mayús suma criterio, conserva la prioridad y no pasa de tres', () => {
        let sorts = cycleSort([], 'a', false);
        sorts = cycleSort(sorts, 'b', true);
        sorts = cycleSort(sorts, 'c', true);
        sorts = cycleSort(sorts, 'd', true);
        expect(sorts.map((sort) => sort.columnId)).toEqual(['a', 'b', 'c']);

        sorts = cycleSort(sorts, 'b', true);
        expect(sorts).toEqual([
            { columnId: 'a', dir: 'asc' },
            { columnId: 'b', dir: 'desc' },
            { columnId: 'c', dir: 'asc' },
        ]);
        expect(cycleSort(sorts, 'b', true).map((sort) => sort.columnId)).toEqual(['a', 'c']);
    });

    it('lee los enlaces antiguos con sort y order sueltos', () => {
        expect(legacySort('name', 'asc')).toBe('name:asc');
        expect(legacySort('name', null)).toBe('name:desc');
        expect(legacySort('name:asc,age:desc', null)).toBe('name:asc,age:desc');
        expect(legacySort(null, 'asc')).toBeNull();
    });
});
