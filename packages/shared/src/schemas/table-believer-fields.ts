import { z } from 'zod';

import type { TableColumnType } from '../constants/table-column-types';

/**
 * El catálogo cerrado de campos del creyente con los que una columna de tabla
 * puede rellenarse (RFC 0025 D3). No refleja la entidad: es una lista
 * explícita. Si hay que añadir uno, se añade aquí y lo heredan la API y la
 * interfaz.
 */
export const TABLE_BELIEVER_FIELDS = [
    'fullName',
    'firstName',
    'lastName',
    'phone',
    'email',
    'status',
    'congregation',
    'arrivedAt',
    'lastNoteAt',
    'arrivalSite',
    'bibleReadings',
    'vivenciasReadings',
    'bibleInstituteTimes',
] as const;

export type TableBelieverField = (typeof TABLE_BELIEVER_FIELDS)[number];

export const tableBelieverFieldSchema = z.enum(TABLE_BELIEVER_FIELDS);

/**
 * Qué tipos de columna aceptan cada campo (RFC 0025 D3, D4): el tipo manda
 * sobre el campo, no al revés. El selector «Rellenar con» solo ofrece los
 * compatibles, y el servidor rechaza el par imposible — no hay coerción.
 */
export const BELIEVER_FIELD_COLUMN_TYPES: Record<TableBelieverField, readonly TableColumnType[]> = {
    fullName: ['text'],
    firstName: ['text'],
    lastName: ['text'],
    phone: ['phone', 'text'],
    email: ['email', 'text'],
    status: ['text'],
    congregation: ['text'],
    arrivedAt: ['date', 'text'],
    lastNoteAt: ['date', 'text'],
    arrivalSite: ['text'],
    bibleReadings: ['number', 'text'],
    vivenciasReadings: ['number', 'text'],
    bibleInstituteTimes: ['number', 'text'],
};

export function isTableBelieverField(value: unknown): value is TableBelieverField {
    return tableBelieverFieldSchema.safeParse(value).success;
}

export function believerFieldMatchesType(
    field: TableBelieverField,
    type: TableColumnType,
): boolean {
    return BELIEVER_FIELD_COLUMN_TYPES[field].includes(type);
}

/** Los campos que se ordenan o filtran como número, para el `CAST` (D12). */
export const BELIEVER_NUMERIC_FIELDS: readonly TableBelieverField[] = [
    'bibleReadings',
    'vivenciasReadings',
    'bibleInstituteTimes',
];

/** El origen de las filas de una tabla: a mano, o el listado de creyentes. */
export const TABLE_SOURCES = ['believers'] as const;
export type TableSource = (typeof TABLE_SOURCES)[number];
export const tableSourceSchema = z.enum(TABLE_SOURCES);

/** El creyente enlazado a una fila, para abrir su ficha desde la tabla (D14). */
export const tableRowBelieverSchema = z.object({
    id: z.uuid(),
    name: z.string(),
    photoKey: z.string().nullable(),
});
export type TableRowBeliever = z.infer<typeof tableRowBelieverSchema>;

/** Añadir creyentes a una tabla en lote (RFC 0025 D7). */
export const addTableBelieversSchema = z.object({
    believerIds: z.array(z.uuid()).min(1).max(200),
});
export type AddTableBelieversInput = z.infer<typeof addTableBelieversSchema>;
