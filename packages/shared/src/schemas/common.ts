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
