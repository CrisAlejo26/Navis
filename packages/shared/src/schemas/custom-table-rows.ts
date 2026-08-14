import { z } from 'zod';

import { paginationQuerySchema } from './common';

/**
 * El valor de una fila: una clave de columna por cada valor (RFC 0021 D13).
 *
 * Es `Record<string, unknown>` a propósito y no `unknown` a secas (Regla 10):
 * la forma depende de las columnas de **esa** tabla, que no se conocen en
 * tiempo de compilación — es justo lo que este RFC existe para resolver. Cada
 * valor se comprueba con `rowValueMatchesType` contra la columna que le toca,
 * nunca con un `JSON.parse` a pelo.
 */
export const rowDataSchema = z.record(z.string(), z.unknown());
export type RowData = z.infer<typeof rowDataSchema>;

/** Una fila, con sus valores ya leídos del JSON y validados por forma. */
export const customTableRowSchema = z.object({
  id: z.uuid(),
  tableId: z.uuid(),
  data: rowDataSchema,
  /** Las claves de columna cuyo valor no encaja con el tipo actual (D9). */
  mismatches: z.array(z.string()),
  createdBy: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type CustomTableRow = z.infer<typeof customTableRowSchema>;

export const createTableRowSchema = z.object({ data: rowDataSchema });
export type CreateTableRowInput = z.infer<typeof createTableRowSchema>;

export const updateTableRowSchema = z.object({ data: rowDataSchema });
export type UpdateTableRowInput = z.infer<typeof updateTableRowSchema>;

/** Los operadores que admite cada familia de tipo (D28). */
export const FILTER_OPERATORS = ['contains', 'between', 'equals', 'in'] as const;
export type FilterOperator = (typeof FILTER_OPERATORS)[number];

/** Un filtro sobre una columna real de la tabla (D28, D30). */
export const rowFilterSchema = z.object({
  columnKey: z.string().min(1).max(80),
  operator: z.enum(FILTER_OPERATORS),
  value: z.unknown(),
});
export type RowFilter = z.infer<typeof rowFilterSchema>;

export const rowFiltersSchema = z.array(rowFilterSchema).max(30);

/** `GET /tables/:id/rows`: página, búsqueda, orden y filtros (D30). */
export const customTableRowsQuerySchema = paginationQuerySchema.extend({
  sort: z.string().max(80).optional(),
  order: z.enum(['asc', 'desc']).default('desc'),
  search: z.string().trim().max(200).optional(),
  /** `RowFilter[]` codificado en JSON, tal y como viaja en la URL. */
  filters: z.string().optional(),
});
export type CustomTableRowsQuery = z.infer<typeof customTableRowsQuerySchema>;
