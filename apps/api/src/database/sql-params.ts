import { isPostgres } from './column-types';

/**
 * Marcador de parámetro para las consultas SQL escritas a mano: Postgres los
 * numera (`$1`, `$2`…) y SQLite usa interrogaciones.
 *
 * Hace falta donde no hay entidad de TypeORM que consultar, es decir, en las
 * tablas que gestiona Better Auth (`user`, `session`, `account`).
 */
export const p = (index: number): string => (isPostgres ? `$${index}` : '?');
