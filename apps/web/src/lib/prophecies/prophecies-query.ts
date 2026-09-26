import {
    DEFAULT_PROPHECY_SORT,
    PROPHECY_SORT_FIELDS,
    isProphecyState,
    isProphecyWindow,
    type PropheciesQuery,
    type ProphecySortField,
    type ProphecyState,
    type TableFilter,
} from '@navis/shared';

import type { TableRequest } from '@/lib/data-table/types';

/** Los parámetros sueltos de los enlaces de la portada (RFC 0004 D12). */
export const LEGACY_PROPHECY_PARAMS = ['state', 'window', 'from', 'to'] as const;

const strings = (value: unknown): string[] =>
    Array.isArray(value)
        ? (value as unknown[]).filter((one): one is string => typeof one === 'string')
        : [];

const dayOf = (date: Date): string =>
    `${String(date.getFullYear())}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

/** El tramo de fechas de recepción: el filtro «entre» de la columna. */
export function prophecyRange(filters: readonly TableFilter[]): { from: string; to: string } {
    const range = filters.find((f) => f.columnId === 'received' && f.operator === 'between')?.value;
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
 * El adaptador entre el estado de la tabla y lo que acepta `GET /prophecies`.
 *
 * Solo viajan `from` y `to`: las ventanas rápidas de antes (`7d`, `30d`, `year`)
 * son ahora atajos de fechas del propio filtro, que las calcula en el navegador.
 */
export function toPropheciesQuery(request: TableRequest): PropheciesQuery {
    const state: ProphecyState[] = request.filters
        .filter((f) => f.columnId === 'state' && f.operator === 'in')
        .flatMap((f) => strings(f.value))
        .filter(isProphecyState);
    const { from, to } = prophecyRange(request.filters);
    const first = request.sorts[0];
    const sort: ProphecySortField =
        PROPHECY_SORT_FIELDS.find((field) => field === first?.columnId) ?? DEFAULT_PROPHECY_SORT;

    return {
        page: request.page,
        limit: request.limit,
        search: request.search || undefined,
        state: state.length > 0 ? state : undefined,
        from: from || undefined,
        to: to || undefined,
        sort,
        order: first?.dir ?? 'desc',
    };
}

/** De los parámetros sueltos de antes (incluida la ventana rápida) a los filtros de la tabla. */
export function prophecyFiltersFromLegacy(
    params: URLSearchParams,
    now: Date = new Date(),
): TableFilter[] {
    const state = params.getAll('state').filter(isProphecyState);
    let from = params.get('from') ?? '';
    const to = params.get('to') ?? '';

    // El tramo a medida manda sobre la ventana rápida, igual que mandaba en el servidor.
    const window = params.get('window') ?? '';
    if (!from && !to && isProphecyWindow(window) && window !== 'all') {
        if (window === 'year') from = `${String(now.getFullYear())}-01-01`;
        else {
            const start = new Date(now);
            start.setDate(start.getDate() - (window === '7d' ? 6 : 29));
            from = dayOf(start);
        }
    }

    return [
        ...(state.length > 0 ? [{ columnId: 'state', operator: 'in' as const, value: state }] : []),
        ...(from || to
            ? [
                  {
                      columnId: 'received',
                      operator: 'between' as const,
                      value: { from: from || undefined, to: to || undefined },
                  },
              ]
            : []),
    ];
}
