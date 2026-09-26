import {
    columnFilteringFeature,
    columnOrderingFeature,
    columnVisibilityFeature,
    createFilteredRowModel,
    createPaginatedRowModel,
    createSortedRowModel,
    filterFn_includesString,
    globalFilteringFeature,
    rowPaginationFeature,
    rowSortingFeature,
    sortFn_alphanumeric,
    sortFn_basic,
    sortFn_datetime,
    tableFeatures,
} from '@tanstack/react-table';

/**
 * Las funciones de TanStack que usa **toda** tabla de Navis: un solo registro,
 * para que `DataTableFeatures` sea el mismo tipo en cualquier columna.
 *
 * En modo servidor los tres modelos de filas (filtrar, ordenar, paginar) se
 * saltan con `manual*` y la tabla solo refleja lo que la API ya resolvió; en
 * modo cliente son los que trabajan. El orden de declaración es el de
 * prerrequisitos que exige `tableFeatures`.
 */
export const dataTableFeatures = tableFeatures({
    columnVisibilityFeature,
    columnOrderingFeature,
    columnFilteringFeature,
    filteredRowModel: createFilteredRowModel(),
    filterFns: { includesString: filterFn_includesString },
    globalFilteringFeature,
    rowSortingFeature,
    sortedRowModel: createSortedRowModel(),
    sortFns: {
        alphanumeric: sortFn_alphanumeric,
        basic: sortFn_basic,
        datetime: sortFn_datetime,
    },
    rowPaginationFeature,
    paginatedRowModel: createPaginatedRowModel(),
});

export type DataTableFeatures = typeof dataTableFeatures;
