import {
    BELIEVER_SORT_FIELDS,
    BELIEVER_STATUSES,
    DEFAULT_BELIEVER_SORT,
    type BelieverSortField,
    type BelieverStatus,
    type BelieversQuery,
    type TableFilter,
} from '@navis/shared';

import type { TableRequest } from '@/lib/data-table/types';

/** Los parámetros sueltos de antes de la tabla: la portada y las listas enlazan con ellos. */
export const LEGACY_BELIEVER_PARAMS = [
    'status',
    'congregationId',
    'giftId',
    'tagId',
    'listId',
    'inLists',
    'attention',
] as const;

const isStatus = (value: string): value is BelieverStatus =>
    (BELIEVER_STATUSES as readonly string[]).includes(value);

const strings = (value: unknown): string[] =>
    Array.isArray(value)
        ? (value as unknown[]).filter((one): one is string => typeof one === 'string')
        : [];

/** Lo que trae un filtro «es uno de» sobre una columna. */
function valuesOf(filters: readonly TableFilter[], columnId: string): string[] {
    return filters
        .filter((filter) => filter.columnId === columnId && filter.operator === 'in')
        .flatMap((filter) => strings(filter.value));
}

/** La API filtra por **un** solo valor en estos cuatro: la columna es `single`, y aquí se toma el primero. */
const firstOf = (filters: readonly TableFilter[], columnId: string): string | undefined =>
    valuesOf(filters, columnId)[0];

function minimumLists(filters: readonly TableFilter[]): number | undefined {
    const filter = filters.find((one) => one.columnId === 'inLists' && one.operator === 'equals');
    const value = Number(filter?.value);
    return Number.isFinite(value) && value > 0 ? value : undefined;
}

/**
 * El adaptador entre el estado de la tabla y lo que acepta `GET /believers` (y su
 * exportación): estados, sede, don, etiqueta, lista, «en N listas o más», «piden
 * atención» y **una** columna de orden.
 */
export function toBelieversQuery(request: TableRequest): BelieversQuery {
    const status = valuesOf(request.filters, 'status').filter(isStatus);
    // «Piden atención» es una casilla de una sola opción, que se marca o no.
    const attention = valuesOf(request.filters, 'attention').includes('true');
    const first = request.sorts[0];
    const sort: BelieverSortField =
        BELIEVER_SORT_FIELDS.find((field) => field === first?.columnId) ?? DEFAULT_BELIEVER_SORT;

    return {
        page: request.page,
        limit: request.limit,
        search: request.search || undefined,
        status: status.length > 0 ? status : undefined,
        congregationId: firstOf(request.filters, 'congregation'),
        giftId: firstOf(request.filters, 'gifts'),
        tagId: firstOf(request.filters, 'tag'),
        listId: firstOf(request.filters, 'list'),
        inLists: minimumLists(request.filters),
        attention: attention || undefined,
        sort,
        order: first?.dir ?? 'asc',
    };
}

/** De los enlaces de antes (`?attention=true`, `?inLists=4`…) a los filtros de la tabla. */
export function believerFiltersFromLegacy(params: URLSearchParams): TableFilter[] {
    const status = params.getAll('status').filter(isStatus);
    const one = (key: string, columnId: string): TableFilter[] => {
        const value = params.get(key) ?? '';
        return value ? [{ columnId, operator: 'in', value: [value] }] : [];
    };
    const inLists = Number(params.get('inLists') ?? '') || 0;

    return [
        ...(status.length > 0
            ? [{ columnId: 'status', operator: 'in' as const, value: status }]
            : []),
        ...one('congregationId', 'congregation'),
        ...one('giftId', 'gifts'),
        ...one('tagId', 'tag'),
        ...one('listId', 'list'),
        ...(inLists > 0
            ? [{ columnId: 'inLists', operator: 'equals' as const, value: inLists }]
            : []),
        ...(params.get('attention') === 'true'
            ? [{ columnId: 'attention', operator: 'in' as const, value: ['true'] }]
            : []),
    ];
}
