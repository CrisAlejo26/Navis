import type { IsoDate } from './dates';

/**
 * Los tres estados de un sueño (RFC 0005 D8).
 *
 * **No se guardan.** Se derivan de si hay interpretación escrita y de si hay
 * fecha de cumplimiento. Una columna `status` además de esos dos datos serían
 * dos fuentes de verdad, y la que discrepa siempre es la columna — el mismo
 * motivo por el que las profecías tampoco la tienen (RFC 0004 D3).
 */
export const DREAM_STATES = ['apuntado', 'estudio', 'cumplido'] as const;

export type DreamState = (typeof DREAM_STATES)[number];

export function isDreamState(value: string): value is DreamState {
  return (DREAM_STATES as readonly string[]).includes(value);
}

/**
 * Lo justo para saber en qué estado está un sueño.
 *
 * Es una forma estructural y no el `Dream` entero a propósito, como
 * `ProphecyProgress`: así lo calculan igual el servicio de la API, la fila del
 * listado y la ficha, y los tests no fabrican un sueño completo (Regla 1 §3).
 */
export interface DreamProgress {
  /** La posible interpretación, si se ha escrito alguna. */
  interpretation: string | null;
  /** El día en que se cumplió. `null` mientras no haya pasado. */
  fulfilledAt: IsoDate | null;
}

/**
 * En qué estado está.
 *
 * El orden importa: un sueño cumplido lo está aunque tenga interpretación —que
 * la tenga es lo normal, no una contradicción—. Y una interpretación en blanco
 * no cuenta como interpretación: el formulario deja el campo vacío y eso no es
 * haber estudiado nada.
 */
export function dreamState(dream: DreamProgress): DreamState {
  if (dream.fulfilledAt) return 'cumplido';
  if (dream.interpretation && dream.interpretation.trim() !== '') return 'estudio';
  return 'apuntado';
}

/** Si ya se cumplió. Se lee mejor que comparar contra la cadena. */
export function isDreamFulfilled(dream: DreamProgress): boolean {
  return dream.fulfilledAt !== null;
}
