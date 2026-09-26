import {
    DEFAULT_TEACHING_SORT,
    TEACHING_SORT_FIELDS,
    type TeachingSortField,
    type TeachingsQuery,
} from '@navis/shared';

import type { TableRequest } from '@/lib/data-table/types';

/**
 * El adaptador entre el estado de la tabla y lo que acepta `GET /teachings`: una
 * búsqueda y **una** columna de orden. Esta sección no tiene filtros.
 */
export function toTeachingsQuery(request: TableRequest): TeachingsQuery {
    const first = request.sorts[0];
    const sort: TeachingSortField =
        TEACHING_SORT_FIELDS.find((field) => field === first?.columnId) ?? DEFAULT_TEACHING_SORT;

    return {
        page: request.page,
        limit: request.limit,
        search: request.search || undefined,
        sort,
        order: first?.dir ?? 'desc',
    };
}
