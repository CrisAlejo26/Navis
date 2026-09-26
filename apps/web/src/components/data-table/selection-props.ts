import type { RowSelection } from '@/lib/data-table/use-row-selection';

/** Lo que las vistas de tabla y de fichas necesitan para pintar y mover la selección. */
export interface SelectionProps<TItem> {
    state: RowSelection<TItem>;
    getKey: (item: TItem) => string;
    /** Qué filas se pueden marcar (un rol de serie no se borra, p. ej.). */
    isSelectable: (item: TItem) => boolean;
    /** El nombre de la fila para el lector de pantalla: «Seleccionar Pastor». */
    rowLabel: (item: TItem) => string;
}
