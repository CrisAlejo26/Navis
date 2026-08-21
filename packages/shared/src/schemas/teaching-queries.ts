/**
 * La fila del listado (RFC 0022 §6): un extracto en texto plano del cuerpo, no
 * el árbol entero — igual que `ProphecyListItem`, para que una página de
 * enseñanzas no cargue el documento completo de cada una.
 *
 * `checklist` viaja aparte porque pinta el filete de color de la fila (§3):
 * `null` cuando la enseñanza no tiene ninguna checklist, y si no fuera así no
 * se podría distinguir de una con todos los ítems sin marcar.
 */
export interface TeachingListItem {
  id: string;
  title: string;
  excerpt: string;
  receivedAt: string;
  checklist: { checked: number; total: number } | null;
}

/** Lo que acepta `GET /teachings`. Todo opcional salvo la paginación. */
export interface TeachingsQuery {
  page?: number;
  limit?: number;
  /** Contra `search_text`, sin acentos. */
  search?: string;
  sort?: 'received' | 'title';
  order?: 'asc' | 'desc';
}

export const TEACHING_SORT_FIELDS = ['received', 'title'] as const;
export type TeachingSortField = (typeof TEACHING_SORT_FIELDS)[number];
export const DEFAULT_TEACHING_SORT: TeachingSortField = 'received';

/** Un mes del gráfico de la portada. Vienen los doce, con los vacíos a cero. */
export interface TeachingMonth {
  /** `AAAA-MM`. */
  month: string;
  total: number;
}

/**
 * Las cuentas de la portada (RFC 0022 §4.4).
 *
 * `checklistRate` es `null` y no `0` cuando ninguna enseñanza tiene checklist
 * todavía: cero por ciento y «no hay nada que contar» son cosas distintas,
 * mismo criterio que `fulfillmentRate` de profecías.
 */
export interface TeachingsStats {
  total: number;
  thisYear: number;
  monthly: TeachingMonth[];
  checklistRate: number | null;
  checklistChecked: number;
  checklistTotal: number;
}
