import { isPostgres } from './column-types';

/**
 * Esa expresión leída como **día de calendario**.
 *
 * Postgres convierte con `CAST(... AS date)`; SQLite no tiene tipo fecha y usa
 * la función `date()`. Es la misma idea que `TIMESTAMP` y `NOW` en
 * `column-types.ts`: absorber la diferencia de entorno en un solo sitio
 * (Regla 1).
 */
export function asDay(expression: string): string {
  return isPostgres ? `CAST(${expression} AS date)` : `date(${expression})`;
}

/**
 * «Cuántos días han pasado desde esa columna hasta ese día», en SQL.
 *
 * Restar fechas no se escribe igual en los dos motores: Postgres resta dos
 * `date` y devuelve un entero; en SQLite hay que pasar por `julianday`.
 *
 * El `date(...)` de la variante SQLite no es decorativo: `julianday` de un
 * `datetime` incluye la hora, y la resta dejaría de ser un número entero de
 * días justo en el cálculo del que depende el aviso (RFC 0003 §5.4).
 */
export function daysSince(expression: string, today: string): string {
  return isPostgres
    ? `(${asDay(today)} - ${asDay(expression)})`
    : `CAST(julianday(${asDay(today)}) - julianday(${asDay(expression)}) AS INTEGER)`;
}

/**
 * Dónde van los nulos al ordenar por una fecha que puede faltar.
 *
 * Quien no tiene ninguna nota va **primero** en ascendente, que es la pregunta
 * de la pantalla (§6.1). En SQLite `NULL` ya ordena así y la cláusula ni
 * existe, así que se pone solo en Postgres —y se prueba en los dos motores—.
 */
export function nullsFor(order: 'ASC' | 'DESC'): 'NULLS FIRST' | 'NULLS LAST' | undefined {
  if (!isPostgres) return undefined;
  return order === 'ASC' ? 'NULLS FIRST' : 'NULLS LAST';
}
