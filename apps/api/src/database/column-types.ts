import { env } from '../config/env';

export const isPostgres = env.DB_DRIVER === 'postgres';

/**
 * Tipos de columna que no se llaman igual en Postgres y en SQLite.
 *
 * Las entidades los usan en vez de literales para que el mismo código sirva
 * en el modo local (SQLite) y en el modo compartido (Postgres). TypeORM valida
 * el tipo contra el driver activo al arrancar, así que un `timestamptz` fijo
 * tumbaría la app en SQLite.
 */
export const TIMESTAMP = isPostgres ? 'timestamptz' : 'datetime';

/**
 * Identificador: `uuid` de verdad en Postgres y texto en SQLite, que no tiene
 * ese tipo. Es lo mismo que hacen las migraciones al crear una clave primaria.
 */
export const UUID = isPostgres ? 'uuid' : 'varchar';

/** Marca temporal por defecto en cada driver, para las migraciones. */
export const NOW = isPostgres ? 'now()' : 'CURRENT_TIMESTAMP';
