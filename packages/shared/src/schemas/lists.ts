import { z } from 'zod';

import { accentSchema } from './congregations';

/**
 * Los tres modos de visibilidad de una lista (RFC 0010 D9).
 *
 * Tres valores y no dos banderas: «pública sí/no» más «pide contraseña sí/no»
 * dan cuatro combinaciones y una de ellas —no pública pero con contraseña— no
 * significa nada. Van en inglés porque son internos y la interfaz los traduce.
 */
export const LIST_VISIBILITIES = ['private', 'link', 'restricted'] as const;

export type ListVisibility = (typeof LIST_VISIBILITIES)[number];

export const listVisibilitySchema = z.enum(LIST_VISIBILITIES);

/**
 * Qué campos **opcionales** salen en la página pública (D16).
 *
 * Lista blanca cerrada: lo que no está aquí no sale, y una columna que alguien
 * añada mañana no se publica por omisión. Todos nacen apagados —por defecto
 * sale el nombre y la posición— y la foto lleva su propio aviso: publicar la
 * cara de alguien, que puede ser menor, se decide a conciencia.
 */
export const listPublicFieldsSchema = z.object({
  /** `initial` deja «Juan P.»: el nombre entero es la opción por defecto. */
  nameStyle: z.enum(['full', 'initial']).default('full'),
  congregation: z.boolean().default(false),
  ministry: z.boolean().default(false),
  photo: z.boolean().default(false),
  note: z.boolean().default(false),
});

export type ListPublicFields = z.infer<typeof listPublicFieldsSchema>;

export const DEFAULT_PUBLIC_FIELDS: ListPublicFields = {
  nameStyle: 'full',
  congregation: false,
  ministry: false,
  photo: false,
  note: false,
};

/** Una **lista**: un conjunto ordenado de creyentes de la iglesia (D1, D2). */
export const listSchema = z.object({
  id: z.uuid(),
  churchId: z.uuid(),
  name: z.string(),
  /** Fijo desde el alta: renombrar no puede romper un enlace guardado (D7). */
  slug: z.string(),
  description: z.string().nullable(),
  accent: z.string(),
  position: z.number().int(),
  isActive: z.boolean(),
  visibility: listVisibilitySchema,
  /** El secreto del enlace. **Nunca** se devuelve si no se puede compartir. */
  shareToken: z.string().nullable(),
  sharedAt: z.string().nullable(),
  shareExpiresAt: z.string().nullable(),
  publicFields: listPublicFieldsSchema,
  allowDownload: z.boolean(),
  hasCover: z.boolean(),
  memberCount: z.number().int(),
  /** El mismo que sale en la página pública: con él se compone la tarjeta. */
  updatedAt: z.string(),
});

export type List = z.infer<typeof listSchema>;

/** La fila del tablón: la lista más lo que hace falta para pintar su panel. */
export const listSummarySchema = listSchema.extend({
  /** Las iniciales de los primeros ocho, para los círculos de la portada. */
  initials: z.array(z.string()),
  /** Catorce días de visitas, para la estela en miniatura. Vacío si no está publicada. */
  recentViews: z.array(z.number().int()),
});

export type ListSummary = z.infer<typeof listSummarySchema>;

export const createListSchema = z.object({
  name: z.string().trim().min(2, 'La lista necesita un nombre').max(60),
  description: z.string().trim().max(280).optional(),
  accent: accentSchema.optional(),
});

export type CreateListInput = z.infer<typeof createListSchema>;

export const updateListSchema = createListSchema.partial().extend({
  isActive: z.boolean().optional(),
  position: z.number().int().min(0).optional(),
  allowDownload: z.boolean().optional(),
});

export type UpdateListInput = z.infer<typeof updateListSchema>;

/**
 * Las cinco de serie. **No se traducen**: son datos de cada iglesia y se pueden
 * renombrar, igual que las sedes o los dones (Regla 2 §6).
 *
 * `ministry` es el slug de la labor de la que sale su color, cuando existe en
 * el catálogo de esa iglesia (D4).
 */
export const SEEDED_LISTS = [
  { name: 'Púlpito', slug: 'pulpito', ministry: 'pulpito' },
  { name: 'Recepción', slug: 'recepcion', ministry: 'recepcion' },
  { name: 'Sonido', slug: 'sonido', ministry: 'sonido' },
  { name: 'Biblias', slug: 'biblias', ministry: 'biblias' },
  { name: 'Ofrenda', slug: 'ofrenda', ministry: 'ofrenda' },
] as const;
