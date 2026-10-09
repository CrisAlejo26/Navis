import { describe, expect, it } from 'vitest';

import { ALL_LOCAL_TABLES, type LocalColumn, type LocalTable } from './local-schema';
import { decodeRow, encodeRow, toWireInstant, type LocalRow } from './sync-codec';
import { columnKind } from './sync-column-kinds';

function sample(table: string, column: LocalColumn): string | number | null {
    switch (columnKind(table, column.name)) {
        case 'instant':
            return '2026-03-14T10:30:00.000Z';
        case 'day':
            return '2026-03-14';
        case 'time':
            return '19:30';
        case 'json':
            return '{"a":[1,2]}';
        default:
            if (column.type === 'bool') return 1;
            if (column.type === 'int' || column.type === 'real') return 7;
            return `${column.name}-valor`;
    }
}

describe('sync-codec', () => {
    describe.each(ALL_LOCAL_TABLES)('ida y vuelta: $name', (table: LocalTable) => {
        it('una fila completa vuelve idéntica tras codificarla y decodificarla', () => {
            const row: LocalRow = {};
            for (const column of table.columns) row[column.name] = sample(table.name, column);
            expect(decodeRow(table, encodeRow(table, row))).toEqual(row);
        });

        it('una fila con todo lo opcional vacío conserva los nulos', () => {
            const row: LocalRow = {};
            for (const column of table.columns) {
                row[column.name] = column.nullable ? null : sample(table.name, column);
            }
            expect(decodeRow(table, encodeRow(table, row))).toEqual(row);
        });
    });

    it('normaliza el instante que TypeORM guarda en SQLite a ISO UTC', () => {
        expect(toWireInstant('2026-03-14 10:30:00.000')).toBe('2026-03-14T10:30:00.000Z');
        expect(toWireInstant('2026-03-14T10:30:00Z')).toBe('2026-03-14T10:30:00.000Z');
    });

    it('un día de calendario no se convierte en instante (no se corre un día)', () => {
        const table = ALL_LOCAL_TABLES.find((one) => one.name === 'prophecies');
        if (!table) throw new Error('falta la tabla');
        const row = Object.fromEntries(
            table.columns.map((c) => [c.name, c.nullable ? null : sample(table.name, c)]),
        );
        row.received_at = '2026-08-01';
        expect(encodeRow(table, row).received_at).toBe('2026-08-01');
    });

    it('rechaza un día o una hora mal formados en vez de propagarlos', () => {
        const table = ALL_LOCAL_TABLES.find((one) => one.name === 'meetings');
        if (!table) throw new Error('falta la tabla');
        const row = Object.fromEntries(
            table.columns.map((c) => [c.name, c.nullable ? null : sample(table.name, c)]),
        );
        expect(() => encodeRow(table, { ...row, date: '14/03/2026' })).toThrow('Día no válido');
        expect(() => encodeRow(table, { ...row, start_time: '7pm' })).toThrow('Hora no válida');
    });
});
