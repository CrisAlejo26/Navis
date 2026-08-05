import { daysBetween, type IsoDate } from './dates';

/**
 * Los tres estados de una profecía (RFC 0004 D3).
 *
 * **No se guardan.** Se derivan de la fecha de cumplimiento y de si hay algún
 * cumplimiento parcial anotado. Una columna `status` además de esos datos serían
 * dos fuentes de verdad que se desincronizan a la primera — es exactamente el
 * error que la RFC 0003 evitó con `is_active` y `status`.
 */
export const PROPHECY_STATES = ['espera', 'camino', 'cumplida'] as const;

export type ProphecyState = (typeof PROPHECY_STATES)[number];

export function isProphecyState(value: string): value is ProphecyState {
  return (PROPHECY_STATES as readonly string[]).includes(value);
}

/**
 * Lo único que hace falta para saber en qué estado está una profecía.
 *
 * Es una forma estructural y no la `Prophecy` entera a propósito, igual que
 * `AlertState` en creyentes: así lo calculan igual el servicio de la API, la
 * fila del listado y la travesía, y los tests no fabrican una ficha completa
 * (Regla 1 §3).
 */
export interface ProphecyProgress {
  /** El día en que se recibió. Es el origen de todo lo que se mide aquí. */
  receivedAt: IsoDate;
  /** El día en que se acabó de cumplir. `null` mientras siga abierta. */
  fulfilledAt: IsoDate | null;
  /** El último cumplimiento parcial anotado, si hay alguno. */
  lastFulfillmentAt: IsoDate | null;
}

/**
 * En qué estado está.
 *
 * El orden de las comprobaciones importa: una profecía cerrada es «cumplida»
 * aunque tenga cumplimientos parciales por el camino — que los tenga es lo
 * normal, no una contradicción.
 */
export function prophecyState(prophecy: ProphecyProgress): ProphecyState {
  if (prophecy.fulfilledAt) return 'cumplida';
  if (prophecy.lastFulfillmentAt) return 'camino';
  return 'espera';
}

/**
 * Cuánto ha esperado: hasta el día en que se cumplió, o hasta hoy si sigue
 * abierta. Nunca negativo — el día en que se recibe la espera es cero, no −1.
 */
export function waitingDays(prophecy: ProphecyProgress, today: IsoDate): number {
  const end = prophecy.fulfilledAt ?? today;
  return Math.max(0, daysBetween(prophecy.receivedAt, end));
}

/** Si ya está cerrada. Se lee mejor que comparar contra la cadena. */
export function isFulfilled(prophecy: ProphecyProgress): boolean {
  return prophecy.fulfilledAt !== null;
}
