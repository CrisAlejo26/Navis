import { z } from 'zod';

import {
  MAX_SELECT_OPTIONS,
  MAX_TABLE_COLUMNS,
  TABLE_COLUMN_TYPES,
} from '../constants/table-column-types';
import { accentSchema } from './congregations';

/** Uno de los doce tipos de columna. `z.enum` y no `refine`: así el tipo queda
 * la unión literal y no `string` a secas, y quien lo use no necesita un `as`. */
export const columnTypeSchema = z.enum(TABLE_COLUMN_TYPES);
export type ColumnTypeInput = z.infer<typeof columnTypeSchema>;

/** Una opción de selección única o múltiple: valor estable, etiqueta y color. */
export const columnOptionSchema = z.object({
  value: z.string().min(1).max(60),
  label: z.string().trim().min(1).max(80),
  color: accentSchema.optional(),
});
export type ColumnOption = z.infer<typeof columnOptionSchema>;

/** Ajustes propios de un tipo: decimales, moneda, si la fecha lleva hora. */
export const columnConfigSchema = z
  .object({
    decimals: z.number().int().min(0).max(6),
    currency: z.string().regex(/^[A-Z]{3}$/, 'Código ISO 4217, como EUR'),
    includeTime: z.boolean(),
  })
  .partial();
export type ColumnConfig = z.infer<typeof columnConfigSchema>;

/**
 * Una columna de una tabla personalizada (RFC 0021, «Las columnas»).
 *
 * `key` es estable desde el alta (D7): renombrar la columna no toca ni una
 * fila de datos, solo esta definición.
 */
export const customTableColumnSchema = z.object({
  id: z.uuid(),
  tableId: z.uuid(),
  key: z.string(),
  label: z.string(),
  type: columnTypeSchema,
  position: z.number().int(),
  required: z.boolean(),
  options: z.array(columnOptionSchema).nullable(),
  config: columnConfigSchema.nullable(),
  isActive: z.boolean(),
});
export type CustomTableColumn = z.infer<typeof customTableColumnSchema>;

const optionInputSchema = z.object({
  value: z.string().min(1).max(60).optional(),
  label: z.string().trim().min(1).max(80),
  color: accentSchema.optional(),
});

export const createTableColumnSchema = z.object({
  label: z.string().trim().min(1, 'La columna necesita un nombre').max(80),
  type: columnTypeSchema,
  required: z.boolean().optional(),
  options: z.array(optionInputSchema).max(MAX_SELECT_OPTIONS).optional(),
  config: columnConfigSchema.optional(),
});
export type CreateTableColumnInput = z.infer<typeof createTableColumnSchema>;

export const updateTableColumnSchema = createTableColumnSchema.partial();
export type UpdateTableColumnInput = z.infer<typeof updateTableColumnSchema>;

/** El orden entero de las columnas, mandado de golpe (D8). */
export const reorderTableColumnsSchema = z.object({
  columnIds: z.array(z.uuid()).max(MAX_TABLE_COLUMNS),
});
export type ReorderTableColumnsInput = z.infer<typeof reorderTableColumnsSchema>;
