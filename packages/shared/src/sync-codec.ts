import { columnKind, type ColumnKind } from './sync-column-kinds';
import type { LocalTable } from './local-schema';

/** Lo que el protocolo lleva por el cable: JSON, sin `Date` ni `0/1`. */
export type WireValue = string | number | boolean | null | WireObject | readonly WireValue[];
export interface WireObject {
    [key: string]: WireValue;
}
export type LocalRow = Record<string, string | number | null>;

const DAY = /^\d{4}-\d{2}-\d{2}$/;
const TIME = /^\d{2}:\d{2}(:\d{2})?$/;
/** TypeORM en SQLite guarda `2026-03-14 10:30:00.000` (UTC, sin zona); el móvil, ISO con `Z`. */
const SQL_INSTANT = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}(\.\d+)?$/;

/** Cualquier instante que circule por la app, como ISO UTC con milisegundos. */
export function toWireInstant(value: string): string {
    const text = SQL_INSTANT.test(value) ? `${value.replace(' ', 'T')}Z` : value;
    const date = new Date(text);
    if (Number.isNaN(date.getTime())) throw new Error(`Instante no válido: ${value}`);
    return date.toISOString();
}

function toWire(kind: ColumnKind | undefined, type: string, value: string | number) {
    if (type === 'bool') return value === 1 || value === '1';
    if (typeof value !== 'string') return value;
    if (kind === 'instant') return toWireInstant(value);
    if (kind === 'day' && !DAY.test(value)) throw new Error(`Día no válido: ${value}`);
    if (kind === 'time' && !TIME.test(value)) throw new Error(`Hora no válida: ${value}`);
    if (kind === 'json') return JSON.parse(value) as WireValue;
    return value;
}

/** Fila de SQLite → objeto del protocolo: booleanos de verdad, JSON como JSON, instantes en UTC. */
export function encodeRow(table: LocalTable, row: LocalRow): WireObject {
    const wire: WireObject = {};
    for (const column of table.columns) {
        const value = row[column.name];
        if (value === null || value === undefined) {
            wire[column.name] = null;
            continue;
        }
        wire[column.name] = toWire(columnKind(table.name, column.name), column.type, value);
    }
    return wire;
}

/** Objeto del protocolo → fila de SQLite. Inversa de `encodeRow` salvo que los instantes salen normalizados. */
export function decodeRow(table: LocalTable, wire: Readonly<Record<string, unknown>>): LocalRow {
    const row: LocalRow = {};
    for (const column of table.columns) {
        const value = wire[column.name];
        if (value === null || value === undefined) {
            row[column.name] = null;
        } else if (column.type === 'bool') {
            row[column.name] = value === true ? 1 : 0;
        } else if (columnKind(table.name, column.name) === 'json') {
            row[column.name] = JSON.stringify(value);
        } else if (typeof value === 'string' || typeof value === 'number') {
            row[column.name] = value;
        } else {
            throw new Error(`${table.name}.${column.name}: valor inesperado`);
        }
    }
    return row;
}
