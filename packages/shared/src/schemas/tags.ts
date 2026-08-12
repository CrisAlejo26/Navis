import { z } from 'zod';

import { isTaskIconKey } from '../constants/task-icons';
import { accentSchema } from './congregations';

/** Una clave del catálogo de iconos (§7.1, D14). */
export const taskIconSchema = z.string().refine(isTaskIconKey, 'Icono no reconocido');

/**
 * Una etiqueta: el vocabulario de una cuenta, por iglesia (RFC 0018 §5.1,
 * D12). Mismo patrón que las emociones de sueños (`EmotionsManager`, RFC 0005
 * D6): se crea, se edita y se lista igual, sin filas de serie.
 */
export const tagSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  icon: z.string(),
  /** Un token o un hexadecimal de `accentSchema` (D13). */
  accent: z.string(),
  position: z.number().int(),
});

export type Tag = z.infer<typeof tagSchema>;

/** La misma etiqueta, con cuántas tareas y hábitos la llevan. */
export const tagWithCountSchema = tagSchema.extend({ count: z.number().int() });

export type TagWithCount = z.infer<typeof tagWithCountSchema>;

/** Recortada a lo que hace falta para pintarla en una tarjeta o un chip. */
export const tagRefSchema = tagSchema.pick({ id: true, name: true, icon: true, accent: true });

export type TagRef = z.infer<typeof tagRefSchema>;

export const createTagSchema = z.object({
  name: z.string().trim().min(1, 'La etiqueta necesita un nombre').max(40),
  icon: taskIconSchema,
  accent: accentSchema,
});

export type CreateTagInput = z.infer<typeof createTagSchema>;

export const updateTagSchema = createTagSchema.partial();

export type UpdateTagInput = z.infer<typeof updateTagSchema>;
