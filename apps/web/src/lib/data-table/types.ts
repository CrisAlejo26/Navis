import type { TableColumnKind, TableFilter, TableOperator, TableSort } from '@navis/shared';

export const TABLE_DENSITIES = ['compact', 'normal', 'comfortable'] as const;
export type TableDensity = (typeof TABLE_DENSITIES)[number];

/**
 * Lo que la tabla necesita saber de una columna para gobernar su estado. Las
 * columnas de TanStack (`ColumnDef`) llevan además su celda y su cabecera; esto
 * es solo lo que el estado y la URL comprueban.
 */
export interface TableColumnSpec {
    id: string;
    kind: TableColumnKind;
    /** Por defecto sí. */
    sortable?: boolean;
    /** Por defecto sí. Las que no (nombre, acciones) no salen en el menú de columnas. */
    hideable?: boolean;
    /** Por defecto sí: las columnas nuevas entran visibles. */
    defaultVisible?: boolean;
    /** Sale en «Filtros avanzados». Por defecto no: una columna de acciones no se filtra. */
    filterable?: boolean;
    /** Además tiene su botón propio en la barra (solo columnas de selección con `options`). */
    facet?: boolean;
    /** Qué condiciones ofrece el filtro. Por defecto, todas las de su tipo; una API que solo entiende «es uno de» lo dice aquí. */
    operators?: readonly TableOperator[];
    /**
     * Existe solo para filtrar: no sale como columna, ni en el menú de columnas, ni
     * en la ficha, ni en el Excel. Sirve para un filtro que no corresponde a ninguna
     * columna visible (las iglesias de una cuenta, p. ej.).
     */
    filterOnly?: boolean;
}

/** Lo que la pantalla necesita para pedir una página a su API. */
export interface TableRequest {
    page: number;
    limit: number;
    search: string;
    sorts: readonly TableSort[];
    filters: TableFilter[];
}
