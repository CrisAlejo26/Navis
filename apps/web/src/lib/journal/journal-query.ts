import {
    DEFAULT_JOURNAL_SORT,
    JOURNAL_SORT_FIELDS,
    isEntryKind,
    type EntryKind,
    type JournalQuery,
    type JournalSortField,
    type TableFilter,
} from '@navis/shared';

import { legacyWindowStart } from '@/lib/data-table/legacy-window';
import type { TableRequest } from '@/lib/data-table/types';

/** Los parámetros sueltos de los enlaces de la portada (RFC 0017 D9). */
export const LEGACY_JOURNAL_PARAMS = ['kind', 'window', 'from', 'to', 'pendingReminder'] as const;

const strings = (value: unknown): string[] =>
    Array.isArray(value)
        ? (value as unknown[]).filter((one): one is string => typeof one === 'string')
        : [];

/** El tramo de fechas de la anotación: el filtro «entre» de la columna de la fecha. */
export function journalRange(filters: readonly TableFilter[]): { from: string; to: string } {
    const range = filters.find((f) => f.columnId === 'date' && f.operator === 'between')?.value;
    const read = (key: 'from' | 'to'): string => {
        const value =
            typeof range === 'object' && range !== null
                ? (range as Record<string, unknown>)[key]
                : '';
        return typeof value === 'string' ? value : '';
    };
    return { from: read('from'), to: read('to') };
}

/**
 * El adaptador entre el estado de la tabla y lo que acepta `GET /journal`: tipos,
 * un tramo de fechas, «con recordatorio pendiente» y **una** columna de orden.
 */
export function toJournalQuery(request: TableRequest): JournalQuery {
    const kind: EntryKind[] = request.filters
        .filter((f) => f.columnId === 'kind' && f.operator === 'in')
        .flatMap((f) => strings(f.value))
        .filter(isEntryKind);
    const { from, to } = journalRange(request.filters);
    const pending = request.filters.some(
        (f) => f.columnId === 'reminder' && f.operator === 'is' && f.value === true,
    );
    const first = request.sorts[0];
    const sort: JournalSortField =
        JOURNAL_SORT_FIELDS.find((field) => field === first?.columnId) ?? DEFAULT_JOURNAL_SORT;

    return {
        page: request.page,
        limit: request.limit,
        search: request.search || undefined,
        kind: kind.length > 0 ? kind : undefined,
        from: from || undefined,
        to: to || undefined,
        pendingReminder: pending || undefined,
        sort,
        order: first?.dir ?? 'desc',
    };
}

/** De los parámetros sueltos de antes (incluida la ventana rápida) a los filtros de la tabla. */
export function journalFiltersFromLegacy(
    params: URLSearchParams,
    now: Date = new Date(),
): TableFilter[] {
    const kind = params.getAll('kind').filter(isEntryKind);
    let from = params.get('from') ?? '';
    const to = params.get('to') ?? '';
    // El tramo a medida manda sobre la ventana rápida, igual que mandaba en el servidor.
    if (!from && !to) from = legacyWindowStart(params.get('window') ?? '', now);

    return [
        ...(kind.length > 0 ? [{ columnId: 'kind', operator: 'in' as const, value: kind }] : []),
        ...(from || to
            ? [
                  {
                      columnId: 'date',
                      operator: 'between' as const,
                      value: { from: from || undefined, to: to || undefined },
                  },
              ]
            : []),
        ...(params.get('pendingReminder') === 'true'
            ? [{ columnId: 'reminder', operator: 'is' as const, value: true }]
            : []),
    ];
}
