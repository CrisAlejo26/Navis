import { plainText, type ExportDocument } from '@/lib/export/document';

/**
 * El listado en CSV, que es lo único que traga otro sistema.
 *
 * **Sin banda de título ni línea de filtros**, al revés que los otros cuatro
 * formatos: un CSV lo lee una máquina, y dos líneas de adorno delante rompen
 * la primera fila de cabecera. Lo que se está exportando se dice en el nombre
 * del fichero y en el diálogo.
 */
export function toCsvText(doc: ExportDocument): string {
  return [doc.headers, ...doc.rows.map((row) => row.map(plainText))]
    .map((cells) => cells.map(escape).join(','))
    .join('\r\n');
}

export function toCsv(doc: ExportDocument): Blob {
  // El BOM no es un capricho: sin él, Excel abre un CSV en UTF-8 como si fuera
  // Latin-1 y «Jesús» sale «JesÃºs». Y `\r\n` porque es lo que espera.
  return new Blob(['﻿', toCsvText(doc), '\r\n'], { type: 'text/csv;charset=utf-8' });
}

/** Entre comillas si lleva coma, comillas o salto; y las comillas se doblan. */
function escape(value: string): string {
  if (!/[",\r\n]/.test(value)) return value;
  return `"${value.replace(/"/g, '""')}"`;
}
