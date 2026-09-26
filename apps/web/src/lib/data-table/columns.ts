import type { TableColumnKind } from '@navis/shared';
import type { ColumnDef, RowData as TableRowData } from '@tanstack/react-table';
import type { ReactNode } from 'react';

import type { ExportCell } from '@/lib/export/columns';

import { cn } from '@/lib/cn';

import type { DataTableFeatures } from './table-features';
import type { TableColumnSpec } from './types';

export type CellValue = string | number | boolean | null | undefined;

/**
 * Una columna de una tabla de Navis, tal y como la escribe cada pantalla.
 *
 * Extiende `TableColumnSpec` (lo que el estado y la URL necesitan saber) con lo
 * que hace falta para pintarla. TanStack es el motor por debajo: la pantalla no
 * escribe `ColumnDef`, `toColumnDefs` se los saca de aquí.
 */
export interface DataTableColumn<TItem extends TableRowData> extends TableColumnSpec {
    /** Ya traducida (Regla 2): nombre de la cabecera, del menú de columnas y de los chips. */
    label: string;
    /** El contenido de la celda. El índice es la posición en la página (escalona animaciones). */
    cell: (item: TItem, index: number) => ReactNode;
    /** El valor en bruto: lo usan el orden y el buscador en modo cliente. */
    value?: (item: TItem) => CellValue;
    /** Sustituye a la etiqueta en la cabecera (la casilla de «seleccionar todo», p. ej.). */
    header?: ReactNode;
    /** Desde qué ancho de pantalla se ve (Regla 5); por debajo se oculta. */
    showFrom?: 'sm' | 'md' | 'lg' | 'xl';
    /** Si el buscador mira esta columna en modo cliente. Por defecto, solo las de texto. */
    searchable?: boolean;
    align?: 'left' | 'right';
    className?: string;
    /** Sale en «Exportar». Por defecto sí si tiene `value` o `exportCell` (las acciones, no). */
    exportable?: boolean;
    /** Cómo se exporta cuando el valor en bruto no basta (un estado con su color, p. ej.). */
    exportCell?: (item: TItem) => ExportCell;
    /** Qué hace el filtro de esta columna, en una frase: sale en el tooltip y en su panel. */
    description?: string;
    /** Los valores posibles de una columna de selección: para el filtro y los chips. `hint` explica qué significa cada uno; `accent` (token o `#rrggbb`) lo pinta como etiqueta de color en el Excel. */
    options?: readonly { value: string; label: string; hint?: string; accent?: string }[];
}

const SORT_FN_BY_KIND: Record<TableColumnKind, 'alphanumeric' | 'basic' | 'datetime'> = {
    text: 'alphanumeric',
    select: 'alphanumeric',
    number: 'basic',
    boolean: 'basic',
    // Las fechas son `AAAA-MM-DD` o ISO: ordenadas como texto salen en orden.
    date: 'datetime',
};

/** Clases para ocultar una columna por debajo de su ancho (`hidden` + `md:table-cell`, etc.). */
export const SHOW_FROM_CLASS = {
    sm: 'sm:table-cell hidden',
    md: 'md:table-cell hidden',
    lg: 'lg:table-cell hidden',
    xl: 'xl:table-cell hidden',
} as const;

/** Las clases de una celda o cabecera: desde qué ancho se ve, alineación y las propias. */
export function cellClass<TItem extends TableRowData>(
    column: DataTableColumn<TItem> | undefined,
): string {
    return cn(
        column?.showFrom && SHOW_FROM_CLASS[column.showFrom],
        column?.align === 'right' && 'text-right',
        column?.className,
    );
}

export function toColumnDefs<TItem extends TableRowData>(
    columns: readonly DataTableColumn<TItem>[],
): ColumnDef<DataTableFeatures, TItem, unknown>[] {
    return columns
        .filter((column) => !column.filterOnly)
        .map((column) => ({
            id: column.id,
            header: column.label,
            accessorFn: column.value ? (item: TItem) => column.value?.(item) : undefined,
            cell: ({ row }) => column.cell(row.original, row.index),
            enableSorting: column.sortable !== false,
            enableHiding: column.hideable !== false,
            // Buscar «1» no debería traer el rol de nivel 1: los números no se buscan.
            enableGlobalFilter: column.searchable ?? column.kind === 'text',
            sortFn: SORT_FN_BY_KIND[column.kind],
        }));
}
