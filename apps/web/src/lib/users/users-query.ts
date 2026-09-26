import {
    USER_SORT_FIELDS,
    type ManagedUsersQuery,
    type SortOrder,
    type TableFilter,
    type UserSortField,
} from '@navis/shared';

import type { TableRequest } from '@/lib/data-table/types';

/** Los valores de un filtro «es uno de» sobre una columna; lo demás no lo entiende esta API. */
function valuesOf(filters: readonly TableFilter[], columnId: string): string[] {
    return filters.flatMap((filter) => {
        if (filter.columnId !== columnId || filter.operator !== 'in') return [];
        return Array.isArray(filter.value)
            ? (filter.value as unknown[]).filter((one): one is string => typeof one === 'string')
            : [];
    });
}

function sortField(columnId: string | undefined): UserSortField {
    return USER_SORT_FIELDS.find((field) => field === columnId) ?? 'createdAt';
}

/**
 * El adaptador entre el estado de la tabla y lo que acepta `GET /admin/users`:
 * una búsqueda, varios roles, varias iglesias y **una** columna de orden (la API
 * no ordena por más). Todo lo que la API no entiende se descarta aquí, en un
 * solo sitio, y no en cada llamador.
 */
export function toUsersQuery(request: TableRequest): ManagedUsersQuery {
    const roles = valuesOf(request.filters, 'role');
    const churchIds = valuesOf(request.filters, 'church');
    const first = request.sorts[0];
    const order: SortOrder = first?.dir ?? 'desc';

    return {
        page: request.page,
        limit: request.limit,
        search: request.search || undefined,
        roles: roles.length > 0 ? roles : undefined,
        churchIds: churchIds.length > 0 ? churchIds : undefined,
        sort: sortField(first?.columnId),
        order,
    };
}
