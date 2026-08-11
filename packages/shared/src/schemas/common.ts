import { z } from 'zod';

import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '../constants';

/** Parámetros de paginación aceptados por los endpoints de listado. */
export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
});

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

/** Envoltorio de respuesta paginada. */
export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/** Formato único de error que devuelve la API (ver AllExceptionsFilter). */
export const apiErrorSchema = z.object({
  statusCode: z.number(),
  message: z.string(),
  error: z.string().optional(),
  details: z.array(z.string()).optional(),
  /**
   * Lo poco que el cliente necesita para pintar la pantalla del error.
   *
   * Existe por **la puerta de una lista restringida** (RFC 0010 §7.3): el 401
   * lleva el nombre de la iglesia, el de la lista y su color, y con eso se pinta
   * el cartel con los nombres tapados. Sin esto habría que devolver 200 con una
   * unión discriminada y el estado dejaría de estar en el código HTTP.
   *
   * Va sin forma: cada endpoint que la use la valida con **su** esquema.
   */
  data: z.unknown().optional(),
  path: z.string().optional(),
  timestamp: z.string().optional(),
});

export type ApiErrorBody = z.infer<typeof apiErrorSchema>;

export const uuidSchema = z.uuid();

/**
 * Un día del calendario, `AAAA-MM-DD`, tal y como lo devuelven Postgres y
 * SQLite para una columna `date`.
 *
 * Es texto y no `Date` a propósito (RFC 0002 §5.5): la reunión del viernes es
 * del viernes en cualquier huso, y en cuanto se convierte a un instante
 * aparece el clásico desfase de un día.
 */
export const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha debe tener el formato AAAA-MM-DD');

/** Una hora de reloj de pared, `HH:MM`. Por el mismo motivo que `isoDateSchema`. */
export const timeSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'La hora debe tener el formato HH:MM');

/**
 * Instante completo, `AAAA-MM-DDTHH:MM`, tal y como lo da un `datetime-local`.
 *
 * Vive aquí y no en `believer-notes.ts` porque la RFC 0017 D6 la reutiliza tal
 * cual para el recordatorio del cuaderno: es exactamente la misma validación,
 * no una parecida (Regla 1 §5).
 */
export const reminderAtSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, 'El recordatorio necesita día y hora');
