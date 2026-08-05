/**
 * Lo común a las tres exportaciones (RFC 0009).
 *
 * Aquí solo vive lo que no sabe de qué módulo es: el tope y la forma de la
 * respuesta. Las columnas de cada uno están junto a su listado
 * —`believer-queries.ts`, `prophecy-queries.ts`, `dream-queries.ts`—, que es
 * donde vive el resto de su contrato.
 */

/**
 * Cuántas filas como mucho salen de un `/export` (D3).
 *
 * No es un número mágico: es lo que cabe en un `.xlsx` sin que el navegador
 * de quien pulsa el botón se atragante rasterizando cincuenta páginas de PDF.
 * Al pasarse, la respuesta lo **dice** y la interfaz lo enseña antes de
 * descargar nada: un truncado silencioso es peor que un error, porque el
 * fichero parece completo y nadie vuelve a mirar.
 */
export const EXPORT_MAX_ROWS = 2000;

/**
 * Lo que devuelve un `/export`.
 *
 * `total` y `returned` van separados a propósito: es lo que permite decir «se
 * exportan 2000 de 3140» en vez de enseñar 2000 y callarse.
 */
export interface ExportResponse<TRow> {
  rows: TRow[];
  /** Cuántas cumplen el filtro de verdad, sin el tope. */
  total: number;
  returned: number;
  truncated: boolean;
}

/**
 * La selección de la pantalla, cuando la hay.
 *
 * Va aparte de la consulta de cada módulo porque es lo único que comparten los
 * tres: **si vienen identificadores, mandan** y el resto de filtros se ignora
 * (D1). Es la diferencia entre «exportar lo filtrado» y «exportar lo marcado»,
 * y el diálogo lo dice con palabras antes de descargar.
 */
export interface ExportSelection {
  ids?: readonly string[];
}
