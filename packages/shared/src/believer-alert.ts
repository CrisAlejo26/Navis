import { daysBetween, type IsoDate } from './dates';

/**
 * Lo único que hace falta para saber cuánto margen queda con alguien.
 *
 * Es una forma estructural y no el `Believer` entero a propósito: así la
 * calculan igual el servicio de la API, el listado y la sonda de la interfaz,
 * y los tests no tienen que fabricar una ficha completa (Regla 1 §3).
 */
export interface AlertState {
  /** Instante del alta, tal y como viaja: ISO 8601. */
  createdAt: string;
  /** Día de la última nota. `null` si todavía no hay ninguna. */
  lastNoteAt: IsoDate | null;
  /** Días de margen. `null` es el aviso apagado (RFC 0003 D3). */
  alertAfterDays: number | null;
}

/**
 * El día desde el que se cuenta: la última nota o, si no hay ninguna, el alta.
 *
 * Desde el alta y no desde el infinito (§5.4): dar a alguien de alta y no
 * escribir nada en dos meses es exactamente el caso que hay que ver.
 */
export function alertSince(believer: AlertState): IsoDate {
  return believer.lastNoteAt ?? believer.createdAt.slice(0, 10);
}

/** Días transcurridos desde entonces. Nunca negativo: hoy es cero, no −1. */
export function daysWithoutNote(believer: AlertState, today: IsoDate): number {
  return Math.max(0, daysBetween(alertSince(believer), today));
}

/** Ha agotado su margen: «pide atención». */
export function needsAttention(believer: AlertState, today: IsoDate): boolean {
  const margin = believer.alertAfterDays;
  return margin !== null && daysWithoutNote(believer, today) > margin;
}

/**
 * Cuánto del margen se ha consumido, de 0 a 1 y **sin tope**: la sonda recorta
 * su relleno al 100 % pero necesita saber que se ha pasado para desbordarse.
 *
 * `null` cuando no hay margen que medir, que es lo que hace que la sonda no
 * pinte pista: el aviso apagado se nota por ausencia, no por un gris más.
 */
export function alertRatio(believer: AlertState, today: IsoDate): number | null {
  const margin = believer.alertAfterDays;
  if (margin === null || margin <= 0) return null;
  return daysWithoutNote(believer, today) / margin;
}
