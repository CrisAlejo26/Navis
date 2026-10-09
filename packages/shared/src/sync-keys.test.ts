import { describe, expect, it } from 'vitest';

import { ALL_LOCAL_TABLES } from './local-schema';
import { entityKeyColumns, joinEntityId, splitEntityId } from './sync-keys';

describe('claves de sincronización', () => {
    it('cada tabla local tiene id o una clave compuesta declarada', () => {
        for (const table of ALL_LOCAL_TABLES) {
            expect(() => entityKeyColumns(table.name), table.name).not.toThrow();
        }
    });

    it('las claves compuestas existen como columnas de su tabla', () => {
        for (const name of ['list_members', 'list_grants']) {
            const columns = ALL_LOCAL_TABLES.find((table) => table.name === name)?.columns.map(
                (column) => column.name,
            );
            for (const column of entityKeyColumns(name)) expect(columns).toContain(column);
        }
    });

    it('une y separa un identificador compuesto sin perder nada', () => {
        const id = joinEntityId('list_members', { list_id: 'l-1', believer_id: 'b-2' });
        expect(id).toBe('l-1:b-2');
        expect(splitEntityId('list_members', id)).toEqual({ list_id: 'l-1', believer_id: 'b-2' });
        expect(splitEntityId('believers', 'abc')).toEqual({ id: 'abc' });
    });

    it('rechaza un identificador con otro número de partes', () => {
        expect(() => splitEntityId('list_members', 'solo-uno')).toThrow('inválido');
    });
});
