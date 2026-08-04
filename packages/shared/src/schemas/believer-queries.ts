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
