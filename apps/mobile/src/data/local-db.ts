import { randomUUID } from 'expo-crypto';
import type { SQLiteRunResult, SQLiteVariadicBindParams } from 'expo-sqlite';

/**
 * El contrato de la base local y sus dos utilidades, en un módulo **sin
 * dependencias** — ni siquiera de `db.ts`. Es lo que rompe el ciclo de
 * importación que Metro avisaba: `db.ts` abre la base y siembra el calendario;
 * el módulo de siembra necesita los identificadores y el tipo, no la apertura.
 * Todos los repositorios siguen importando de `db.ts`, que reexporta.
 *
 * Las firmas son las mismas que usaban los repositorios (todas con
 * parámetros posicionales), ahora vivas aquí y no en `db.ts`.
 */
export type LocalDb = {
  getAllAsync<T>(source: string, ...params: SQLiteVariadicBindParams): Promise<T[]>;
  getFirstAsync<T>(source: string, ...params: SQLiteVariadicBindParams): Promise<T | null>;
  runAsync(source: string, ...params: SQLiteVariadicBindParams): Promise<SQLiteRunResult>;
  execAsync(source: string): Promise<void>;
  withTransactionAsync(fn: () => Promise<void>): Promise<void>;
};

/** Para el `created_at`/`updated_at` de cada fila: ISO completo, comparable como texto. */
export function nowIso(): string {
  return new Date().toISOString();
}

/** Un identificador con la misma forma que los uuid de la API (texto v4). */
export function newId(): string {
  return randomUUID();
}
