import type { TableRequest } from './types';

/** Todas las filas que cumplen los filtros de la tabla, y si se ha llegado al tope. */
export interface ExportAllResult<TItem> {
    items: TItem[];
    total: number;
    truncated: boolean;
}

/**
 * Lo que una pantalla dice para que su tabla se pueda exportar. Sin esto no hay
 * botón «Exportar»: exportar es opt-in, como las casillas.
 */
export interface TableExportConfig<TItem> {
    /** El nombre del módulo: «Roles». Da nombre a la pestaña y al fichero. */
    label: string;
    /** La banda de arriba del fichero: «Iglesia El Faro · Roles». Por defecto, `label`. */
    title?: string;
    /**
     * Solo en modo servidor: trae **todas** las filas que cumplen los filtros. La
     * tabla solo tiene la página que se ve y un fichero de diez filas no es lo que
     * se esperaba al pulsar «Exportar». Sin esto se exporta la página.
     */
    fetchAll?: (request: TableRequest, signal: AbortSignal) => Promise<ExportAllResult<TItem>>;
}
