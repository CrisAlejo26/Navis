import { z } from 'zod';

import { accentSchema } from './congregations';

/**
 * Una **etiqueta de creyente** del catálogo de la iglesia.
 *
 * Misma forma que un don —nombre, color y orden— y por el mismo motivo: es lo
 * que hace falta para distinguirla de un vistazo y que dos personas no escriban
 * «En busca de trabajo» y «en busca de trabajo» y acaben siendo dos etiquetas.
 *
 * No son las etiquetas de tareas y hábitos (RFC 0018): esas son de cada cuenta
 * y se cuelgan de tareas. Estas son del catálogo de la iglesia y se cuelgan de
 * personas —«En busca de trabajo», «Voluntario»…—. Por eso el nombre no se
 * traduce (es dato de la iglesia) y el módulo vive junto a dones y labores.
 */
export const believerTagSchema = z.object({
  id: z.uuid(),
  churchId: z.uuid(),
  name: z.string(),
  /** Token de la paleta o `#rrggbb`, como las sedes. */
  accent: z.string(),
  position: z.number().int(),
  /** De serie: se renombra y se desactiva, no se borra. Aquí siempre falso. */
  isSystem: z.boolean(),
  /** Apagada deja de proponerse, sin perder a quien ya la tiene. */
  isActive: z.boolean(),
});

export type BelieverTag = z.infer<typeof believerTagSchema>;

export const createBelieverTagSchema = z.object({
  name: z.string().trim().min(2, 'El nombre de la etiqueta es obligatorio').max(60),
  accent: accentSchema.optional(),
});

export type CreateBelieverTagInput = z.infer<typeof createBelieverTagSchema>;

export const updateBelieverTagSchema = createBelieverTagSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export type UpdateBelieverTagInput = z.infer<typeof updateBelieverTagSchema>;
