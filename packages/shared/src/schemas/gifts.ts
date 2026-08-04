import { z } from 'zod';

import { accentSchema } from './congregations';

/**
 * Los siete dones que trae cada iglesia de serie (RFC 0003 D5).
 *
 * Se pueden **renombrar y desactivar** —el vocabulario es de cada iglesia—,
 * pero no borrar: son el suelo común. Los que añada la iglesia sí se borran.
 *
 * El nombre **no se traduce** (D6): es dato de la iglesia, igual que el de una
 * sede. Lo que sí va en los seis idiomas es todo lo que lo rodea.
 */
export const SYSTEM_GIFTS = [
  'Profecía',
  'Imposición de manos',
  'Bautismo con el Espíritu Santo',
  'Sanidad',
  'Echar fuera demonios',
  'Sabiduría',
  'Discernimiento',
] as const;

/**
 * Un don del catálogo de la iglesia. Misma forma que una sede —nombre, color y
 * orden— y por el mismo motivo: es lo que hace falta para distinguirlo de un
 * vistazo (RFC 0002 §5.1).
 */
export const giftSchema = z.object({
  id: z.uuid(),
  churchId: z.uuid(),
  name: z.string(),
  /** Token de la paleta o `#rrggbb`, como las sedes. */
  accent: z.string(),
  position: z.number().int(),
  /** De serie: se renombra y se desactiva, no se borra (D5). */
  isSystem: z.boolean(),
  /** Apagado deja de proponerse, sin perder el historial de quien lo tiene. */
  isActive: z.boolean(),
});

export type Gift = z.infer<typeof giftSchema>;

export const createGiftSchema = z.object({
  name: z.string().trim().min(2, 'El nombre del don es obligatorio').max(60),
  accent: accentSchema.optional(),
});

export type CreateGiftInput = z.infer<typeof createGiftSchema>;

export const updateGiftSchema = createGiftSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export type UpdateGiftInput = z.infer<typeof updateGiftSchema>;
