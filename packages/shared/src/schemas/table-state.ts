import { z } from 'zod';

import { isoDateSchema } from './common';

/**
 * El estado de una tabla de datos (filtros y orden), común a todas las pantallas.
 *
 * Es el contrato **del cliente**: cada pantalla lo traduce a los parámetros que
 * ya acepta su endpoint (`state`, `from`, `to`…) con un adaptador propio. No hay
 * un endpoint genérico: los listados tienen filtros tipados y el móvil los usa.
 */
export const TABLE_COLUMN_KINDS = ['text', 'number', 'date', 'select', 'boolean'] as const;
export type TableColumnKind = (typeof TABLE_COLUMN_KINDS)[number];

/** Qué operadores admite cada tipo de columna, el primero es el que se ofrece de entrada. */
export const TABLE_OPERATORS_BY_KIND = {
    text: ['contains', 'equals', 'startsWith', 'isEmpty', 'isNotEmpty'],
    number: ['equals', 'between', 'gt', 'lt', 'isEmpty', 'isNotEmpty'],
    date: ['between', 'on', 'before', 'after', 'isEmpty', 'isNotEmpty'],
    select: ['in', 'notIn', 'isEmpty', 'isNotEmpty'],
    boolean: ['is'],
} as const satisfies Record<TableColumnKind, readonly string[]>;

export type TableOperator = (typeof TABLE_OPERATORS_BY_KIND)[TableColumnKind][number];

export const MAX_TABLE_FILTERS = 30;
export const MAX_TABLE_SORTS = 3;

const nonEmptyText = z.string().trim().min(1).max(200);
const textList = z.array(z.string().min(1).max(200)).min(1).max(50);
const numberRange = z
    .object({ min: z.number().finite().optional(), max: z.number().finite().optional() })
    .refine((range) => range.min !== undefined || range.max !== undefined);
const dateRange = z
    .object({ from: isoDateSchema.optional(), to: isoDateSchema.optional() })
    .refine((range) => range.from !== undefined || range.to !== undefined);

/** La forma del valor que lleva cada operador. Los de «vacío» no llevan ninguno. */
const VALUE_SCHEMAS: Record<TableOperator, z.ZodType> = {
    contains: nonEmptyText,
    startsWith: nonEmptyText,
    equals: z.union([nonEmptyText, z.number().finite()]),
    gt: z.number().finite(),
    lt: z.number().finite(),
    between: z.union([numberRange, dateRange]),
    on: isoDateSchema,
    before: isoDateSchema,
    after: isoDateSchema,
    in: textList,
    notIn: textList,
    is: z.boolean(),
    isEmpty: z.undefined(),
    isNotEmpty: z.undefined(),
};

export function isTableOperator(value: string): value is TableOperator {
    return Object.hasOwn(VALUE_SCHEMAS, value);
}

/** ¿Este operador vale para una columna de este tipo? */
export function operatorFitsKind(operator: TableOperator, kind: TableColumnKind): boolean {
    return (TABLE_OPERATORS_BY_KIND[kind] as readonly string[]).includes(operator);
}

/** ¿El valor tiene la forma que pide el operador? `unknown` entra, un booleano sale. */
export function isTableFilterValue(operator: TableOperator, value: unknown): boolean {
    return VALUE_SCHEMAS[operator].safeParse(value).success;
}

/** Un filtro sobre una columna. El valor se comprueba con `isTableFilterValue`. */
export type TableFilter = { columnId: string; operator: TableOperator; value?: unknown };

export type TableSortDirection = 'asc' | 'desc';
export interface TableSort {
    columnId: string;
    dir: TableSortDirection;
}
