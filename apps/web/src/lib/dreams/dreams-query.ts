import {
    DEFAULT_DREAM_SORT,
    DREAM_SORT_FIELDS,
    isDreamState,
    type DreamsQuery,
    type DreamSortField,
    type DreamState,
    type TableFilter,
} from '@navis/shared';

import type { TableRequest } from '@/lib/data-table/types';

/** Los parámetros sueltos de los enlaces de la portada y de las franjas (RFC 0005 D16). */
export const LEGACY_DREAM_PARAMS = ['state', 'emotion', 'from', 'to'] as const;

const strings = (value: unknown): string[] =>
    Array.isArray(value)
        ? (value as unknown[]).filter((one): one is string => typeof one === 'string')
        : [];

function valuesOf(filters: readonly TableFilter[], columnId: string): string[] {
    return filters.flatMap((filter) =>
        filter.columnId === columnId && filter.operator === 'in' ? strings(filter.value) : [],
    );
}

/** El tramo de noches: el filtro «entre» de la columna de la noche. */
export function dreamRange(filters: readonly TableFilter[]): { from: string; to: string } {
    const range = filters.find((f) => f.columnId === 'dreamed' && f.operator === 'between')?.value;
    const from =
        typeof range === 'object' && range !== null ? (range as { from?: unknown }).from : '';
    const to = typeof range === 'object' && range !== null ? (range as { to?: unknown }).to : '';
    return {
        from: typeof from === 'string' ? from : '',
        to: typeof to === 'string' ? to : '',
    };
}

/**
 * El adaptador entre el estado de la tabla y lo que acepta `GET /dreams`: estados,
 * emociones y un tramo de noches, y **una** columna de orden.
 */
export function toDreamsQuery(request: TableRequest): DreamsQuery {
    const state: DreamState[] = valuesOf(request.filters, 'state').filter(isDreamState);
    const emotion = valuesOf(request.filters, 'emotions');
    const { from, to } = dreamRange(request.filters);
    const first = request.sorts[0];
    const sort: DreamSortField =
        DREAM_SORT_FIELDS.find((field) => field === first?.columnId) ?? DEFAULT_DREAM_SORT;

    return {
        page: request.page,
        limit: request.limit,
        search: request.search || undefined,
        state: state.length > 0 ? state : undefined,
        emotion: emotion.length > 0 ? emotion : undefined,
        from: from || undefined,
        to: to || undefined,
        sort,
        order: first?.dir ?? 'desc',
    };
}

/** De los parámetros sueltos de antes a los filtros de la tabla. */
export function dreamFiltersFromLegacy(params: URLSearchParams): TableFilter[] {
    const state = params.getAll('state').filter(isDreamState);
    const emotion = params.getAll('emotion');
    const from = params.get('from') ?? '';
    const to = params.get('to') ?? '';

    return [
        ...(state.length > 0 ? [{ columnId: 'state', operator: 'in' as const, value: state }] : []),
        ...(emotion.length > 0
            ? [{ columnId: 'emotions', operator: 'in' as const, value: emotion }]
            : []),
        ...(from || to
            ? [
                  {
                      columnId: 'dreamed',
                      operator: 'between' as const,
                      value: { from: from || undefined, to: to || undefined },
                  },
              ]
            : []),
    ];
}
