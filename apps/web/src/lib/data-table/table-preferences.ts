import {
    DEFAULT_PAGE_SIZE,
    MAX_TABLE_FILTERS,
    MAX_TABLE_SORTS,
    isPageSize,
    sanitizeTableFilters,
    type TableColumnRef,
    type TableFilter,
} from '@navis/shared';
import { z } from 'zod';

import { TABLE_DENSITIES, type TableColumnSpec, type TableDensity } from './types';

/** Cuántas vistas guardadas admite una tabla: más de veinte ya no se encuentran. */
export const MAX_SAVED_VIEWS = 20;

const sortsSchema = z
    .array(z.object({ columnId: z.string(), dir: z.enum(['asc', 'desc']) }))
    .max(MAX_TABLE_SORTS);

const viewSchema = z.object({
    id: z.string().min(1),
    name: z.string().trim().min(1).max(60),
    // Sin validar aquí: se comprueba contra las columnas de hoy al reconciliar.
    filters: z.array(z.unknown()).max(MAX_TABLE_FILTERS),
    sorts: sortsSchema,
    columnVisibility: z.record(z.string(), z.boolean()),
    columnOrder: z.array(z.string()),
});

const preferencesSchema = z.object({
    v: z.literal(1),
    columnVisibility: z.record(z.string(), z.boolean()),
    columnOrder: z.array(z.string()),
    pageSize: z.number().refine(isPageSize),
    density: z.enum(TABLE_DENSITIES),
    sorts: sortsSchema,
    filters: z.array(z.unknown()).max(MAX_TABLE_FILTERS).default([]),
    views: z.array(viewSchema).max(MAX_SAVED_VIEWS).default([]),
});

type StoredPreferences = z.infer<typeof preferencesSchema>;
type StoredView = z.infer<typeof viewSchema>;

/**
 * Una vista guardada: la combinación de filtros, orden y columnas que tiene
 * nombre y se recupera con un clic. Vive en el navegador de quien la guarda.
 */
export interface SavedTableView extends Omit<StoredView, 'filters'> {
    filters: TableFilter[];
}

/**
 * Lo que la persona ha dejado puesto en esta tabla: columnas, tamaño de página,
 * densidad, **el orden y los filtros de la última vez** (para no rehacerlos cada
 * vez que vuelve) y sus vistas guardadas. La búsqueda de texto y la página no: son
 * de un rato.
 */
export interface TablePreferences extends Omit<StoredPreferences, 'filters' | 'views'> {
    filters: TableFilter[];
    views: SavedTableView[];
}

export const DEFAULT_DENSITY: TableDensity = 'normal';

export function defaultPreferences(columns: readonly TableColumnSpec[]): TablePreferences {
    return {
        v: 1,
        columnVisibility: Object.fromEntries(
            columns.map((column) => [column.id, column.defaultVisible !== false]),
        ),
        columnOrder: columns.map((column) => column.id),
        pageSize: DEFAULT_PAGE_SIZE,
        density: DEFAULT_DENSITY,
        sorts: [],
        filters: [],
        views: [],
    };
}

/**
 * Pone lo guardado al día con las columnas de **hoy**: sin esto, añadir una
 * columna en una versión nueva la dejaría oculta para quien ya había guardado
 * sus preferencias, y borrar una dejaría ids fantasma para siempre. Lo mismo
 * vale para cada vista guardada.
 */
export function reconcilePreferences(
    stored: StoredPreferences,
    columns: readonly TableColumnSpec[],
): TablePreferences {
    const refs: TableColumnRef[] = columns.map(({ id, kind }) => ({ id, kind }));
    const ids = new Set(columns.map((column) => column.id));
    const sortable = new Set(columns.filter((c) => c.sortable !== false).map((c) => c.id));

    const order = (saved: readonly string[]) => {
        const known = saved.filter((id) => ids.has(id));
        return [...known, ...columns.map((c) => c.id).filter((id) => !known.includes(id))];
    };
    const visibility = (saved: Readonly<Record<string, boolean>>) =>
        Object.fromEntries(
            columns.map((column) => [
                column.id,
                column.hideable === false
                    ? true
                    : (saved[column.id] ?? column.defaultVisible !== false),
            ]),
        );
    const sorts = (saved: StoredPreferences['sorts']) =>
        saved.filter((sort) => sortable.has(sort.columnId));

    return {
        ...stored,
        columnOrder: order(stored.columnOrder),
        columnVisibility: visibility(stored.columnVisibility),
        sorts: sorts(stored.sorts),
        // Un filtro sobre una columna que ya no existe se descarta, no rompe.
        filters: sanitizeTableFilters(stored.filters, refs),
        views: stored.views.map((view) => ({
            ...view,
            columnOrder: order(view.columnOrder),
            columnVisibility: visibility(view.columnVisibility),
            sorts: sorts(view.sorts),
            filters: sanitizeTableFilters(view.filters, refs),
        })),
    };
}

/** JSON roto, versión vieja o forma inesperada: valores por defecto, sin lanzar. */
export function parsePreferences(
    raw: string | null,
    columns: readonly TableColumnSpec[],
): TablePreferences {
    if (raw) {
        try {
            const parsed = preferencesSchema.safeParse(JSON.parse(raw));
            if (parsed.success) return reconcilePreferences(parsed.data, columns);
        } catch {
            // Se cae al valor por defecto.
        }
    }
    return defaultPreferences(columns);
}
