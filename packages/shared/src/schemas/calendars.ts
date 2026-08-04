import { z } from 'zod';

import { ministrySchema } from './ministries';

/**
 * Un **calendario**: un espacio de programación completo, con sus reuniones
 * fijas y sus programaciones (RFC 0002 D15).
 *
 * Púlpito, recepción, sonido y biblias no comparten cuadrícula —quien programa
 * el sonido no quiere ver las fases de la predicación—, así que cada ministerio
 * tiene el suyo y en la barra lateral son subentradas de «Calendario».
 *
 * Lo que **sí** comparten todos: la iglesia, sus sedes y sus personas.
 */
export const calendarSchema = z.object({
  id: z.uuid(),
  churchId: z.uuid(),
  name: z.string(),
  /** Derivado del nombre. Es lo que va en la URL: `/calendar/pulpito`. */
  slug: z.string(),
  /** La **labor** a la que propone: el slug de un rol. Nulo es «a cualquiera». */
  ministry: z.string().nullable(),
  position: z.number().int(),
});

export type Calendar = z.infer<typeof calendarSchema>;

export const createCalendarSchema = z.object({
  name: z.string().trim().min(2, 'El calendario necesita un nombre').max(60),
  ministry: ministrySchema.nullable().optional(),
});

export type CreateCalendarInput = z.infer<typeof createCalendarSchema>;

export const updateCalendarSchema = createCalendarSchema.partial().extend({
  position: z.number().int().min(0).optional(),
});

export type UpdateCalendarInput = z.infer<typeof updateCalendarSchema>;

/**
 * Los cuatro que siembra la migración, con su ministerio. No se traducen: son
 * datos de cada iglesia y se pueden renombrar (Regla 2 §6).
 */
export const SEEDED_CALENDARS = [
  { name: 'Púlpito', slug: 'pulpito', ministry: 'pulpito' },
  { name: 'Recepción', slug: 'recepcion', ministry: 'recepcion' },
  { name: 'Sonido', slug: 'sonido', ministry: 'sonido' },
  { name: 'Biblias', slug: 'biblias', ministry: 'biblias' },
] as const;
