import { isPostgres } from './column-types';

/** Las `key` de columna solo salen de `toSlug`: `[a-z0-9-]+`, nunca vacío. */
const SAFE_KEY = /^[a-z0-9-]+$/;

function safe(key: string): string {
  if (!SAFE_KEY.test(key)) throw new Error(`Clave de columna con caracteres no permitidos: ${key}`);
  return key;
}

/**
 * El valor de una clave dentro del JSON de `data`, como texto (RFC 0021 D15).
 *
 * El JSON se guarda como `text` en los dos motores (D13), así que extraerlo
 * pide una expresión distinta en cada uno: `data::jsonb ->> 'clave'` en
 * Postgres, `json_extract(data, '$.clave')` en SQLite. Es la misma familia de
 * trampa que ya resuelven `column-types.ts` y `date-sql.ts`.
 */
export function jsonFieldExpr(column: string, key: string): string {
  const clave = safe(key);
  return isPostgres ? `(${column}::jsonb ->> '${clave}')` : `json_extract(${column}, '$.${clave}')`;
}

/**
 * El mismo valor, convertido para **ordenar** según el tipo declarado de la
 * columna (D15).
 *
 * Un número guardado como texto ordena «10» antes que «2» si no se convierte
 * primero. Fecha y texto ordenan bien como texto porque `AAAA-MM-DD` ya lo
 * hace; número y moneda necesitan `CAST`; casilla se trata como texto
 * `'true'`/`'false'`, que ya ordena como cabe esperar.
 */
export function jsonFieldOrderExpr(column: string, key: string, type: string): string {
  const value = jsonFieldExpr(column, key);
  if (type !== 'number' && type !== 'currency') return value;

  return isPostgres ? `NULLIF(${value}, '')::numeric` : `CAST(NULLIF(${value}, '') AS REAL)`;
}

/** Igual, pero para **comparar** en un filtro `between` sobre número o moneda. */
export function jsonFieldNumericExpr(column: string, key: string): string {
  return jsonFieldOrderExpr(column, key, 'number');
}
