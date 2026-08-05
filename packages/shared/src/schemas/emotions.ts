import { z } from 'zod';

import { accentSchema } from './congregations';

/**
 * Las doce emociones que vienen de serie (RFC 0005 §5.2).
 *
 * Están aquí **solo para tipar la clave de traducción** —`dreams.emotions.paz`
 * y compañía— y para poder recorrerlas en la interfaz sin construir claves al
 * vuelo (Regla 2 §3). El color y el orden de cada una viven en la base de
 * datos, y **la migración que las siembra las escribe literalmente**, sin
 * importar esta constante: una migración que depende de un valor que puede
 * cambiar deja de estar congelada, que es justo lo que pasó con `CreateRoles`
 * (D5).
 */
export const SYSTEM_EMOTION_SLUGS = [
  'felicidad',
  'alegria',
  'tranquilidad',
  'paz',
  'esperanza',
  'libertad',
  'curiosidad',
  'confusion',
  'ansiedad',
  'tristeza',
  'miedo',
  'persecucion',
] as const;

export type SystemEmotionSlug = (typeof SYSTEM_EMOTION_SLUGS)[number];

export function isSystemEmotionSlug(value: string): value is SystemEmotionSlug {
  return (SYSTEM_EMOTION_SLUGS as readonly string[]).includes(value);
}

/**
 * Una emoción del vocabulario.
 *
 * Las **del sistema** traen `slug` y no traen nombre: el texto lo pone la
 * interfaz, que es lo único que las deja salir en los seis idiomas (D4). Las
 * **propias** traen el texto que escribió su dueño, en su idioma, y se enseñan
 * tal cual: son suyas y nadie más las va a leer.
 */
export const emotionSchema = z.object({
  id: z.uuid(),
  slug: z.string().nullable(),
  name: z.string().nullable(),
  /** Un token o un `#rrggbb` de `ACCENT_PALETTE` (D7). */
  accent: accentSchema,
  position: z.number().int(),
});

export type Emotion = z.infer<typeof emotionSchema>;

/** Si es una de las doce de serie: las que nadie puede editar ni borrar (D6). */
export function isSystemEmotion(emotion: Pick<Emotion, 'slug'>): boolean {
  return emotion.slug !== null;
}

/** La misma, con cuántos sueños la llevan. Es lo que devuelve el vocabulario. */
export const emotionWithCountSchema = emotionSchema.extend({
  count: z.number().int(),
});

export type EmotionWithCount = z.infer<typeof emotionWithCountSchema>;

export const createEmotionSchema = z.object({
  name: z.string().trim().min(1, 'La emoción necesita un nombre').max(40),
  accent: accentSchema,
});

export type CreateEmotionInput = z.infer<typeof createEmotionSchema>;

export const updateEmotionSchema = createEmotionSchema.partial();

export type UpdateEmotionInput = z.infer<typeof updateEmotionSchema>;
