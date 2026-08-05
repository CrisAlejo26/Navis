import type { DreamState } from '../dream-state';
import type { Emotion } from './emotions';

/** Por qué se puede ordenar el listado. La noche primero: es como se busca. */
export const DREAM_SORT_FIELDS = ['dreamed', 'fulfilled', 'title'] as const;

export type DreamSortField = (typeof DREAM_SORT_FIELDS)[number];

export const DEFAULT_DREAM_SORT: DreamSortField = 'dreamed';

export function isDreamSortField(value: string): value is DreamSortField {
  return (DREAM_SORT_FIELDS as readonly string[]).includes(value);
}

/**
 * La fila del listado: trae ya calculado lo que necesita para pintarse (§7.5).
 *
 * `excerpt` y no el cuerpo entero, y por eso **desde la fila no se edita el
 * texto**: guardar lo truncado recortaría el sueño sin avisar. El formulario de
 * edición recibe el identificador y lo vuelve a pedir entero.
 */
export interface DreamListItem {
  id: string;
  title: string | null;
  excerpt: string;
  dreamedAt: string;
  fulfilledAt: string | null;
  state: DreamState;
  hasInterpretation: boolean;
  audiosCount: number;
  /** Las emociones enteras: son el color de la fila y llevan su acento (D20). */
  emotions: Emotion[];
}

/** Lo que acepta `GET /dreams`. Todo opcional salvo la paginación (§6.1). */
export interface DreamsQuery {
  page?: number;
  limit?: number;
  /** Busca en título, cuerpo e interpretación, en el servidor. */
  search?: string;
  state?: readonly DreamState[];
  /** Varias suman: el sueño que lleve cualquiera de ellas. */
  emotion?: readonly string[];
  from?: string;
  to?: string;
  year?: number;
  sort?: DreamSortField;
  order?: 'asc' | 'desc';
}

/**
 * La fila que se exporta (RFC 0009 §6.3).
 *
 * Lleva **el cuerpo entero**, la interpretación y lo que significó al
 * cumplirse: las tres cosas que la fila del listado no trae y que son justo
 * las que alguien quiere releer fuera de la aplicación.
 */
export interface DreamExportRow extends Omit<DreamListItem, 'excerpt'> {
  body: string;
  interpretation: string | null;
  fulfillmentMeaning: string | null;
  /** Cuándo se apuntó, que no es la noche en que se soñó. */
  createdAt: string;
}

/** Una noche de la franja. Vienen las 84, con las vacías a cero (D19). */
export interface DreamNight {
  /** `AAAA-MM-DD`. */
  day: string;
  count: number;
}

/** Una semana de la franja, ya sumada: el cliente no hace cuentas con fechas. */
export interface DreamWeek {
  /** El lunes de esa semana, `AAAA-MM-DD`. */
  weekStart: string;
  count: number;
}

/** Un mes de la línea de los últimos doce. */
export interface DreamMonth {
  /** `AAAA-MM`. */
  month: string;
  count: number;
}

/**
 * Cuánto se sueña cada día de la semana.
 *
 * `weekday` va de 0 (domingo) a 6 (sábado), como `weekdayOf` y como
 * `Date.getDay()`. La interfaz lo enseña empezando en lunes, que es la semana
 * europea, pero eso es cosa suya: el dato viaja en la convención de siempre.
 */
export interface DreamWeekdayCount {
  weekday: number;
  count: number;
}

/** Una emoción del mapa, con su color, para pintar la barra apilada. */
export interface DreamEmotionCount extends Emotion {
  count: number;
}

/**
 * Las cuentas de la portada (§6.2).
 *
 * `nights` y `weeks` salen de la misma consulta —las semanas son la suma de sus
 * noches— y se devuelven ya sumadas para que el cliente no opere con fechas,
 * que es donde se cuelan los errores de huso (D11).
 */
export interface DreamsStats {
  total: number;
  thisMonth: number;
  thisWeek: number;
  fulfilled: number;
  nights: DreamNight[];
  weeks: DreamWeek[];
  monthly: DreamMonth[];
  byWeekday: DreamWeekdayCount[];
  /** De más a menos. Solo las que se han usado alguna vez. */
  byEmotion: DreamEmotionCount[];
  /** Noches seguidas con algo apuntado, contando hacia atrás desde hoy. */
  streak: number;
  lastFulfilled: { id: string; title: string | null; fulfilledAt: string } | null;
}
