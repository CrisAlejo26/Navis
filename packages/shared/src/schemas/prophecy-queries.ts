import type { ProphecyState } from '../prophecy-state';

/**
 * Las ventanas de tiempo del filtro, sobre la fecha de recepción (RFC 0004 D12).
 *
 * Son las cuatro que se piden desde la interfaz. Una ventana a medida se pide
 * con `from` y `to`, que es lo que usan los enlaces de la portada.
 */
export const PROPHECY_WINDOWS = ['7d', '30d', 'year', 'all'] as const;

export type ProphecyWindow = (typeof PROPHECY_WINDOWS)[number];

export const DEFAULT_PROPHECY_WINDOW: ProphecyWindow = 'all';

export function isProphecyWindow(value: string): value is ProphecyWindow {
  return (PROPHECY_WINDOWS as readonly string[]).includes(value);
}

/**
 * Por qué se puede ordenar el listado.
 *
 * `lastMovement` es «lo último que se movió» y por eso existe
 * `last_fulfillment_at`: sin esa columna habría que resolverlo con un `MAX()`
 * correlacionado en cada fila (D4).
 */
export const PROPHECY_SORT_FIELDS = ['received', 'fulfilled', 'title', 'lastMovement'] as const;

export type ProphecySortField = (typeof PROPHECY_SORT_FIELDS)[number];

export const DEFAULT_PROPHECY_SORT: ProphecySortField = 'received';

export function isProphecySortField(value: string): value is ProphecySortField {
  return (PROPHECY_SORT_FIELDS as readonly string[]).includes(value);
}

/**
 * La fila del listado: lleva ya calculado lo que necesita para pintarse, para
 * que la interfaz no vuelva a pedir nada (§6.1).
 *
 * `excerpt` y no el cuerpo entero: una página de veinte profecías largas serían
 * cientos de kilobytes para pintar tres líneas.
 */
export interface ProphecyListItem {
  id: string;
  title: string;
  excerpt: string;
  receivedAt: string;
  fulfilledAt: string | null;
  lastFulfillmentAt: string | null;
  state: ProphecyState;
  waitingDays: number;
  fulfillmentsCount: number;
  /**
   * Los días de cada cumplimiento parcial, de más antiguo a más reciente.
   *
   * Viajan con la fila porque son las **marcas de la travesía** (§7.5): sin
   * ellas, el trayecto no podría enseñar por dónde se ha ido cumpliendo y la
   * vista firma se quedaría en una barra de progreso. Son fechas, no filas
   * enteras — el texto de cada uno se lee en la ficha.
   */
  fulfillmentDays: string[];
}

/** Lo que acepta `GET /prophecies`. Todo opcional salvo la paginación (§6.1). */
export interface PropheciesQuery {
  page?: number;
  limit?: number;
  /** Contra `search_text`, sin acentos (D13). */
  search?: string;
  state?: readonly ProphecyState[];
  window?: ProphecyWindow;
  from?: string;
  to?: string;
  sort?: ProphecySortField;
  order?: 'asc' | 'desc';
}

/**
 * La fila que se exporta (RFC 0009 §6.3).
 *
 * Lleva **el cuerpo entero** y no el `excerpt` de la fila: un fichero que se
 * lleva el texto recortado sin avisar es el mismo error que editar desde el
 * listado, y ese ya está anotado en `CLAUDE.md`.
 */
export interface ProphecyExportRow extends Omit<ProphecyListItem, 'excerpt'> {
  body: string;
  /** Cuándo se apuntó, que no es cuándo se recibió. */
  createdAt: string;
}

/** Un mes del gráfico. Vienen los doce, con los vacíos a cero (§6.2). */
export interface ProphecyMonth {
  /** `AAAA-MM`. */
  month: string;
  received: number;
  fulfilled: number;
}

/**
 * Las cuentas de la portada (§6.2).
 *
 * `fulfillmentRate` es `null` y no `0` cuando no hay ninguna profecía: cero por
 * ciento y «todavía no hay nada» son cosas distintas y se pintan distinto.
 */
export interface PropheciesStats {
  total: number;
  byState: Record<ProphecyState, number>;
  fulfilledThisYear: number;
  receivedThisYear: number;
  fulfillmentRate: number | null;
  /** La mediana, no la media: una profecía de quince años desplazaría la media. */
  medianWaitingDays: number | null;
  monthly: ProphecyMonth[];
  longestWaiting: { id: string; title: string; waitingDays: number } | null;
}
