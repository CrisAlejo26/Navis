import { z } from 'zod';

import { rowFilterSchema } from './custom-table-rows';

/**
 * Solo tres tipos de vista, y dos de ellos piden una columna concreta para
 * existir (RFC 0021 D25). La de cuadrícula no tiene fila propia: se sintetiza
 * en el cliente y no se puede borrar.
 */
export const TABLE_VIEW_TYPES = ['grid', 'kanban', 'calendar'] as const;
export type TableViewType = (typeof TABLE_VIEW_TYPES)[number];

/** Una vista guardada de la tabla: filtros, orden y qué columnas se ven (D24). */
export const customTableViewSchema = z.object({
  id: z.uuid(),
  tableId: z.uuid(),
  name: z.string(),
  type: z.enum(TABLE_VIEW_TYPES),
  /** La `key` de la columna de selección que agrupa un tablero. */
  groupBy: z.string().nullable(),
  /** La `key` de la columna de fecha que ordena un calendario. */
  dateColumn: z.string().nullable(),
  filters: z.array(rowFilterSchema),
  sortBy: z.string().nullable(),
  sortOrder: z.enum(['asc', 'desc']),
  position: z.number().int(),
});
export type CustomTableView = z.infer<typeof customTableViewSchema>;

export const createTableViewSchema = z.object({
  name: z.string().trim().min(1, 'La vista necesita un nombre').max(60),
  type: z.enum(['kanban', 'calendar']),
  groupBy: z.string().max(80).optional(),
  dateColumn: z.string().max(80).optional(),
});
export type CreateTableViewInput = z.infer<typeof createTableViewSchema>;

export const updateTableViewSchema = z.object({
  name: z.string().trim().min(1).max(60).optional(),
  filters: z.array(rowFilterSchema).max(30).optional(),
  sortBy: z.string().max(80).nullable().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});
export type UpdateTableViewInput = z.infer<typeof updateTableViewSchema>;
