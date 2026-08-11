import type { EntryKind } from './journal';

/** Las ventanas de tiempo del filtro, sobre `occurred_at` (RFC 0017 D9). */
export const JOURNAL_WINDOWS = ['7d', '30d', 'year', 'all'] as const;

export type JournalWindow = (typeof JOURNAL_WINDOWS)[number];

export const DEFAULT_JOURNAL_WINDOW: JournalWindow = 'all';

export function isJournalWindow(value: string): value is JournalWindow {
  return (JOURNAL_WINDOWS as readonly string[]).includes(value);
}

/** Por qué columna ordena cada campo del listado (§6.1). */
export const JOURNAL_SORT_FIELDS = ['date', 'title', 'kind'] as const;

export type JournalSortField = (typeof JOURNAL_SORT_FIELDS)[number];

export const DEFAULT_JOURNAL_SORT: JournalSortField = 'date';

export function isJournalSortField(value: string): value is JournalSortField {
  return (JOURNAL_SORT_FIELDS as readonly string[]).includes(value);
}

/**
 * La fila del listado: trae ya calculado lo que necesita para pintarse (§6.1).
 *
 * `excerpt` y no la anotación entera, y por eso **desde la fila no se edita**:
 * el formulario de edición recibe el identificador y la vuelve a pedir entera.
 */
export interface JournalEntryListItem {
  id: string;
  title: string;
  kind: EntryKind;
  occurredAt: string;
  excerpt: string;
  hasLearned: boolean;
  hasAudio: boolean;
  remindAt: string | null;
  remindDoneAt: string | null;
  authorName: string | null;
}

/** Lo que acepta `GET /journal`. Todo opcional salvo la paginación (§6.1). */
export interface JournalQuery {
  page?: number;
  limit?: number;
  /** Contra `search_text`, sin acentos (D8). */
  search?: string;
  /** Repetible: varios suman. */
  kind?: readonly EntryKind[];
  window?: JournalWindow;
  from?: string;
  to?: string;
  /** `true` deja solo entradas con recordatorio sin atender. */
  pendingReminder?: boolean;
  sort?: JournalSortField;
  order?: 'asc' | 'desc';
}

/**
 * La fila que se exporta (D12): lleva la anotación y lo aprendido enteros, y
 * no el `excerpt` de la fila del listado.
 */
export interface JournalExportRow extends Omit<JournalEntryListItem, 'excerpt'> {
  annotation: string;
  learned: string | null;
  remindText: string | null;
  createdAt: string;
}

/** Un mes del gráfico. Vienen los doce, con los vacíos a cero (§6.2). */
export interface JournalMonth {
  /** `AAAA-MM`. */
  month: string;
  total: number;
}

/** Las cuentas de la portada (§6.2). */
export interface JournalStats {
  total: number;
  byKind: Record<EntryKind, number>;
  pendingReminders: number;
  thisMonth: number;
  monthly: JournalMonth[];
}
