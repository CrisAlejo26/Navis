import { formatDay, formatNumber } from '@/lib/format';
import type { ExportAlign, ExportCell, ExportColumn } from '@/lib/export/columns';

/**
 * La exportación ya resuelta: encabezados, filas y las dos líneas de la
 * cabecera. Es lo único que ven los cinco escritores.
 */
export interface ExportDocument {
  /** El nombre del módulo: «Creyentes». Da nombre a la pestaña y al fichero. */
  label: string;
  /** La banda de arriba: «Iglesia El Faro · Creyentes». */
  title: string;
  /** La segunda línea: los filtros en palabras y cuántas filas van. */
  subtitle: string;
  headers: string[];
  aligns: ExportAlign[];
  widths: number[];
  rows: ExportCell[][];
}

/** Los topes del ancho de columna: ni una columna de tres letras ni una de cien. */
const MIN_WIDTH = 9;
const MAX_WIDTH = 48;

export function buildDocument<TRow>(input: {
  label: string;
  title: string;
  subtitle: string;
  columns: readonly ExportColumn<TRow>[];
  rows: readonly TRow[];
}): ExportDocument {
  const rows = input.rows.map((row) => input.columns.map((column) => column.value(row)));

  return {
    label: input.label,
    title: input.title,
    subtitle: input.subtitle,
    headers: input.columns.map((column) => column.header),
    aligns: input.columns.map((column, index) => column.align ?? alignFor(rows, index)),
    widths: input.columns.map(
      (column, index) => column.width ?? widthOf(column.header, rows, index),
    ),
    rows,
  };
}

/**
 * Los números a la derecha y lo demás a la izquierda, mirando la primera celda
 * que tenga algo: una columna entera vacía se queda a la izquierda, que es lo
 * que menos molesta.
 */
function alignFor(rows: readonly ExportCell[][], index: number): ExportAlign {
  const first = rows.find((row) => row[index]?.kind === 'number');
  return first ? 'right' : 'left';
}

function widthOf(header: string, rows: readonly ExportCell[][], index: number): number {
  const largest = rows.reduce((longest, row) => {
    const cell = row[index];
    return Math.max(longest, cell ? plainText(cell).length : 0);
  }, header.length);

  return Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, largest + 2));
}

/**
 * La celda como texto plano, en el idioma activo.
 *
 * Es lo que consumen CSV, Markdown y la vista previa. El día se formatea con
 * `formatDay`, que trabaja en UTC: `new Date('2026-03-14')` es medianoche UTC
 * y en Bogotá se pintaría el 13 (CLAUDE.md).
 */
export function plainText(cell: ExportCell): string {
  if (cell.kind === 'text') return cell.text;
  if (cell.kind === 'number') return formatNumber(cell.value);
  if (cell.kind === 'day') return formatDay(cell.iso);
  return cell.tags.map((tag) => tag.text).join(' · ');
}
