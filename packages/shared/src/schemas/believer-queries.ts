import type { Believer, BelieverStatus } from './believers';
import type { Gift } from './gifts';

/**
 * Por qué se puede ordenar el listado.
 *
 * `lastNote` es el orden interesante —«quién lleva más sin que le escriban»— y
 * el que responde la pregunta de la pantalla. Los que no tienen ninguna nota
 * van **primero**, no últimos (§6.1).
 */
export const BELIEVER_SORT_FIELDS = ['name', 'status', 'lastNote', 'createdAt'] as const;

export type BelieverSortField = (typeof BELIEVER_SORT_FIELDS)[number];

export const DEFAULT_BELIEVER_SORT: BelieverSortField = 'name';

export function isBelieverSortField(value: string): value is BelieverSortField {
  return (BELIEVER_SORT_FIELDS as readonly string[]).includes(value);
}

/**
 * La fila del listado: lleva ya calculado todo lo que necesita para pintarse,
 * para que la interfaz no tenga que volver a pedir nada (§6.1).
 */
export interface BelieverListItem extends Believer {
  daysWithoutNote: number;
  needsAttention: boolean;
  /** El don entero —nombre y color—, para pintar la etiqueta sin otra consulta. */
  gifts: Gift[];
  notesCount: number;
}

/** Lo que acepta `GET /believers`. Todo opcional salvo la paginación (§6.1). */
export interface BelieversQuery {
  page?: number;
  limit?: number;
  /** Contra `search_name`, sin acentos (D14). */
  search?: string;
  status?: readonly BelieverStatus[];
  congregationId?: string;
  giftId?: string;
  /**
   * Solo quien tenga esa **labor** (`pulpito`).
   *
   * Lo tenía el selector del calendario y no el listado, y hacía falta en los
   * dos: es uno de los filtros con los que se llena una lista (RFC 0010 D5).
   */
  ministry?: string;
  /** Solo quien esté en esa lista. Es la vuelta del camino de la RFC 0010 D5. */
  listId?: string;
  /**
   * Solo quien esté en **esa cantidad de listas o más** (RFC 0010 D36).
   *
   * Es a donde lleva la línea «7 personas están en 4 listas o más» de la portada
   * de listas: una cifra que no lleva a ninguna parte es un adorno.
   */
  inLists?: number;
  /** Deja solo a quien ha agotado su margen. */
  attention?: boolean;
  sort?: BelieverSortField;
  order?: 'asc' | 'desc';
}

/**
 * Las cuentas de la cabecera (§6.2). Alimentan las pastillas de filtro, que es
 * donde viven: la métrica es la navegación, no un panel de indicadores.
 */
export interface BelieversSummary {
  total: number;
  byStatus: Record<BelieverStatus, number>;
  needsAttention: number;
  newThisMonth: number;
}

/**
 * La fila que se exporta (RFC 0009 §6.3).
 *
 * Es **la misma** que la del listado, y aquí sí coinciden: una persona no
 * tiene ningún campo largo que la fila trunque, así que no hay nada que volver
 * a pedir. En profecías y en sueños no pasa eso —allí la fila lleva un
 * `excerpt`— y por eso allí sí hay una forma propia.
 *
 * El alias existe igualmente para que el tipo se llame por lo que es en cada
 * sitio: si algún día la ficha crece con un campo que el listado no lleve, se
 * cambia esta línea y no las tres que la usan.
 */
export type BelieverExportRow = BelieverListItem;
