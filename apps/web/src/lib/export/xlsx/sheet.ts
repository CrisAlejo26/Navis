import type { ExportCell } from '@/lib/export/columns';
import { plainText, type ExportDocument } from '@/lib/export/document';
import { toExcelSerial } from '@/lib/export/xlsx/serial';
import { STYLE, type XlsxStyles } from '@/lib/export/xlsx/styles';
import { cellRef, columnLetter, escapeXml, XML_HEADER } from '@/lib/export/xlsx/xml';

/** Dónde empieza cada cosa. La 3 se queda vacía: es el aire bajo la banda. */
const TITLE_ROW = 1;
const SUBTITLE_ROW = 2;
const HEADER_ROW = 4;
const FIRST_DATA_ROW = 5;

/**
 * La hoja de datos (RFC 0009 §8.1): banda de título, línea de filtros, la fila
 * de encabezados fija y las filas debajo.
 *
 * **Sin cuadrícula** (`showGridLines="0"`): los bordes finos hacen el trabajo y
 * el resultado se parece a un documento y no a una hoja de cálculo en bruto.
 *
 * El orden de los elementos lo fija el esquema de OOXML —`sheetViews`, `cols`,
 * `sheetData`, `autoFilter`, `mergeCells`— y no se puede alterar.
 */
export function buildDataSheet(doc: ExportDocument, styles: XlsxStyles): string {
  const columns = Math.max(1, doc.headers.length);
  const last = columnLetter(columns);
  const lastRow = HEADER_ROW + doc.rows.length;

  const filas = [
    banda(TITLE_ROW, columns, doc.title, STYLE.title, 34),
    banda(SUBTITLE_ROW, columns, doc.subtitle, STYLE.subtitle, 18),
    `<row r="3" ht="6" customHeight="1"/>`,
    fila(
      HEADER_ROW,
      doc.headers.map((header) => ({ kind: 'text', text: header }) satisfies ExportCell),
      () => STYLE.header,
      28,
    ),
    ...doc.rows.map((row, index) =>
      fila(FIRST_DATA_ROW + index, row, (cell) => styleFor(cell, index % 2 === 1, styles)),
    ),
  ];

  return [
    XML_HEADER,
    '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">',
    `<dimension ref="A1:${last}${String(Math.max(lastRow, HEADER_ROW))}"/>`,
    '<sheetViews><sheetView showGridLines="0" tabSelected="1" workbookViewId="0">',
    // La fila de encabezados se queda arriba al bajar: es lo primero que hace
    // cualquiera al abrir un listado largo.
    `<pane ySplit="${String(HEADER_ROW)}" topLeftCell="A${String(FIRST_DATA_ROW)}" activePane="bottomLeft" state="frozen"/>`,
    '</sheetView></sheetViews>',
    '<sheetFormatPr defaultRowHeight="15"/>',
    cols(doc.widths),
    `<sheetData>${filas.join('')}</sheetData>`,
    `<autoFilter ref="A${String(HEADER_ROW)}:${last}${String(Math.max(lastRow, HEADER_ROW))}"/>`,
    `<mergeCells count="2"><mergeCell ref="A1:${last}1"/><mergeCell ref="A2:${last}2"/></mergeCells>`,
    '</worksheet>',
  ].join('');
}

function cols(widths: readonly number[]): string {
  if (widths.length === 0) return '';

  const items = widths
    .map(
      (width, index) =>
        `<col min="${String(index + 1)}" max="${String(index + 1)}" width="${String(width)}" customWidth="1"/>`,
    )
    .join('');

  return `<cols>${items}</cols>`;
}

/**
 * Una fila de banda: el texto en la primera celda y el resto vacías **con el
 * mismo estilo**, que es lo que hace que el color llegue hasta el final. Sin
 * ellas, la combinación pinta solo la primera columna.
 */
function banda(row: number, columns: number, text: string, style: number, height: number): string {
  const cells = Array.from({ length: columns }, (_unused, index) =>
    index === 0
      ? cellXml(cellRef(1, row), style, { kind: 'text', text })
      : `<c r="${cellRef(index + 1, row)}" s="${String(style)}"/>`,
  ).join('');

  return `<row r="${String(row)}" ht="${String(height)}" customHeight="1">${cells}</row>`;
}

function fila(
  row: number,
  cells: readonly ExportCell[],
  styleOf: (cell: ExportCell) => number,
  height?: number,
): string {
  const contenido = cells
    .map((cell, index) => cellXml(cellRef(index + 1, row), styleOf(cell), cell))
    .join('');
  const alto = height === undefined ? '' : ` ht="${String(height)}" customHeight="1"`;

  return `<row r="${String(row)}"${alto}>${contenido}</row>`;
}

/**
 * El estilo de una celda de datos.
 *
 * Una celda de etiquetas se tiñe con **su** color y por eso no lleva cebra: el
 * color entra por el dato y la cebra es decoración, así que gana el dato. Con
 * varias etiquetas de distinto color no se tiñe: media celda de un color y
 * media de otro no existe en Excel.
 */
function styleFor(cell: ExportCell, alt: boolean, styles: XlsxStyles): number {
  if (cell.kind === 'number') return alt ? STYLE.numberAlt : STYLE.number;
  if (cell.kind === 'day') return alt ? STYLE.dateAlt : STYLE.date;

  if (cell.kind === 'tags') {
    const accents = new Set(cell.tags.map((tag) => tag.accent));
    if (accents.size === 1) {
      const [accent] = [...accents];
      if (accent) return styles.tagStyle(accent);
    }
  }

  return alt ? STYLE.textAlt : STYLE.text;
}

function cellXml(ref: string, style: number, cell: ExportCell): string {
  const attrs = `r="${ref}" s="${String(style)}"`;

  if (cell.kind === 'number') return `<c ${attrs}><v>${String(cell.value)}</v></c>`;

  if (cell.kind === 'day') {
    const serial = toExcelSerial(cell.iso);
    // Una fecha que no se puede convertir se escribe tal cual y no se pierde.
    if (serial === null) return inlineString(attrs, cell.iso);
    return `<c ${attrs}><v>${String(serial)}</v></c>`;
  }

  return inlineString(attrs, plainText(cell));
}

/**
 * Cadenas **en línea** y no en `sharedStrings.xml`: se ahorra un fichero y una
 * tabla de índices a cambio de unos kilobytes, y con dos mil filas eso no se
 * nota.
 */
function inlineString(attrs: string, value: string): string {
  if (value === '') return `<c ${attrs}/>`;
  return `<c ${attrs} t="inlineStr"><is><t xml:space="preserve">${escapeXml(value)}</t></is></c>`;
}
