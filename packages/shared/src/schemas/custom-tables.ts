import { z } from 'zod';

import { accentSchema } from './congregations';
import { customTableColumnSchema } from './custom-table-columns';
import { taskIconSchema } from './tags';

/** Una tabla personalizada (RFC 0021, «La tabla»). */
export const customTableSchema = z.object({
  id: z.uuid(),
  churchId: z.uuid(),
  name: z.string(),
  slug: z.string(),
  icon: z.string(),
  accent: z.string(),
  position: z.number().int(),
  isActive: z.boolean(),
});
export type CustomTable = z.infer<typeof customTableSchema>;

/** La ficha: la tabla con sus columnas activas, en su orden. */
export const customTableWithColumnsSchema = customTableSchema.extend({
  columns: z.array(customTableColumnSchema),
});
export type CustomTableWithColumns = z.infer<typeof customTableWithColumnsSchema>;

export const createCustomTableSchema = z.object({
  name: z.string().trim().min(2, 'El nombre de la tabla es obligatorio').max(60),
  icon: taskIconSchema,
  accent: accentSchema.optional(),
});
export type CreateCustomTableInput = z.infer<typeof createCustomTableSchema>;

export const updateCustomTableSchema = createCustomTableSchema.partial().extend({
  isActive: z.boolean().optional(),
  position: z.number().int().min(0).optional(),
});
export type UpdateCustomTableInput = z.infer<typeof updateCustomTableSchema>;
