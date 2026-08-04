import { alertRatio, daysWithoutNote, type AlertState, type IsoDate } from '@navis/shared';

/**
 * Los cuatro estados de la sonda (RFC 0003 §7.3).
 *
 * `off` es el aviso apagado —no se pinta pista— y `never` es no tener ninguna
 * nota, que es la llamada más fuerte de la pantalla y por eso no se disfraza
 * de cero.
 */
export type SondaTone = 'ok' | 'near' | 'overdue' | 'never' | 'off';

export interface Sounding {
  tone: SondaTone;
  /** Días transcurridos desde la última nota, o desde el alta si no hay ninguna. */
  days: number;
  /** Cuánto se pinta de la pista, de 0 a 1. `null` no pinta pista. */
  fill: number | null;
  margin: number | null;
}

/** El umbral a partir del cual la sonda avisa antes de desbordarse. */
const CERCA = 0.7;

/**
 * Cuánto margen queda con esa persona.
 *
 * Los días y el desbordamiento salen de `@navis/shared`, que es donde vive la
 * regla y donde también la lee el servidor: si la fila dijera una cosa y el
 * filtro «piden atención» otra, la pantalla enseñaría a alguien que ella misma
 * ha dejado fuera.
 */
export function sound(believer: AlertState, today: IsoDate): Sounding {
  const days = daysWithoutNote(believer, today);
  const ratio = alertRatio(believer, today);
  const margin = believer.alertAfterDays;

  if (ratio === null) return { tone: 'off', days, fill: null, margin: null };
  if (believer.lastNoteAt === null) {
    // Sin ninguna nota la pista va vacía, pero el tono sí escala: alguien a
    // quien nadie ha escrito en tres meses no es un aviso suave.
    return { tone: ratio > 1 ? 'overdue' : 'never', days, fill: 0, margin };
  }

  const fill = Math.min(1, ratio);
  if (ratio > 1) return { tone: 'overdue', days, fill, margin };
  if (ratio > CERCA) return { tone: 'near', days, fill, margin };

  return { tone: 'ok', days, fill, margin };
}
