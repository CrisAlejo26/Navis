import { z } from 'zod';

import { isoDateSchema } from './common';
import { emotionSchema } from './emotions';

/** Un audio de un sueño. El fichero vive en disco; esto es su ficha (D13). */
export const dreamAudioSchema = z.object({
  id: z.uuid(),
  dreamId: z.uuid(),
  mimeType: z.string(),
  sizeBytes: z.number().int(),
  durationSeconds: z.number().int().nullable(),
  /** Si se grabó ahí mismo o se adjuntó ya hecho. Se dice en la interfaz. */
  recorded: z.boolean(),
  createdAt: z.string(),
});

export type DreamAudio = z.infer<typeof dreamAudioSchema>;

/** De dónde lo descarga la interfaz. Un solo sitio que lo diga (Regla 1). */
export function dreamAudioPath(audioId: string): string {
  return `/dream-audios/${audioId}`;
}

/**
 * Un sueño (RFC 0005 §5.1).
 *
 * No lleva `churchId`: es de un usuario y no de una iglesia (D1), igual que la
 * profecía del RFC 0004.
 */
export const dreamSchema = z.object({
  id: z.uuid(),
  /** Opcional: a las cuatro de la mañana nadie titula (D17). */
  title: z.string().nullable(),
  body: z.string(),
  /** La noche en que se soñó, no el día en que se escribió (D11). */
  dreamedAt: isoDateSchema,
  interpretation: z.string().nullable(),
  /** No nulo ⇒ cumplido (D8). */
  fulfilledAt: isoDateSchema.nullable(),
  /** Qué significó, escrito al cerrarlo (D10). */
  fulfillmentMeaning: z.string().nullable(),
  emotions: z.array(emotionSchema),
  audios: z.array(dreamAudioSchema),
  createdAt: z.string(),
});

export type Dream = z.infer<typeof dreamSchema>;

const titleSchema = z.string().trim().max(200);
const bodySchema = z.string().trim().min(1, 'Escribe lo que soñaste').max(20000);
const longTextSchema = z.string().trim().max(20000);
const emotionIdsSchema = z.array(z.uuid()).max(20);

/**
 * Al crear, **solo el cuerpo es obligatorio** (D17). La interpretación y el
 * cumplimiento no están aquí: se escriben desde la ficha, que es cuando se sabe
 * algo.
 */
export const createDreamSchema = z.object({
  title: titleSchema.optional(),
  body: bodySchema,
  dreamedAt: isoDateSchema,
  emotionIds: emotionIdsSchema.optional(),
});

export type CreateDreamInput = z.infer<typeof createDreamSchema>;

/**
 * Sin `refine` para comparar las dos fechas: al editar puede llegar solo una y
 * no hay con qué compararla. La comprobación de D12 la hace el servicio, que sí
 * tiene delante la fila entera.
 */
export const updateDreamSchema = z.object({
  title: titleSchema.optional(),
  body: bodySchema.optional(),
  dreamedAt: isoDateSchema.optional(),
  interpretation: longTextSchema.nullable().optional(),
  /** `null` lo vuelve a abrir y se lleva por delante lo que significó. */
  fulfilledAt: isoDateSchema.nullable().optional(),
  fulfillmentMeaning: longTextSchema.nullable().optional(),
  emotionIds: emotionIdsSchema.optional(),
});

export type UpdateDreamInput = z.infer<typeof updateDreamSchema>;
