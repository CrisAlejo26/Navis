import type { ExportDocument } from '@/lib/export/document';
import type { SummaryBlock } from '@/lib/export/summary';
import { toArgb } from '@/lib/export/xlsx/palette';
import { STYLE, type XlsxStyles } from '@/lib/export/xlsx/styles';
import { escapeXml, XML_HEADER } from '@/lib/export/xlsx/xml';

interface Bloque {
  /** El rango de la columna de cifras, para ponerle la barra. */
  range: string;
  accent: string;
}

/**
 * La hoja «Resumen» (RFC 0009 D8): un bloque por columna de etiquetas, con la
 * cuenta de cada valor y **una barra dentro de la celda** en el color del dato.
 *
 * La barra es formato condicional de tipo `dataBar`, que es lo que convierte
 * un volcado en algo que se lee de un vistazo. Cada bloque lleva la suya con el
 * color de su valor más frecuente: una sola barra por bloque, porque un
 * `dataBar` tiene un color y no uno por fila.
 */
export function buildSummarySheet(
  doc: ExportDocument,
  blocks: readonly SummaryBlock[],
  styles: XlsxStyles,
  labels: { title: string; rows: string },
): string {
  const filas: string[] = [
    banda(1, labels.title, STYLE.title, 34),
    banda(2, labels.rows, STYLE.subtitle, 18),
    '<row r="3" ht="6" customHeight="1"/>',
  ];

  const bloques: Bloque[] = [];
  let row = 4;

  for (const block of blocks) {
    filas.push(
      `<row r="${String(row)}" ht="22" customHeight="1">${texto(`A${String(row)}`, STYLE.blockHeader, block.label)}<c r="B${String(row)}" s="${String(STYLE.blockHeader)}"/></row>`,
    );
    row += 1;

    const primera = row;
    for (const entry of block.entries) {
      filas.push(
        `<row r="${String(row)}">${texto(`A${String(row)}`, styles.tagStyle(entry.accent), entry.label)}<c r="B${String(row)}" s="${String(STYLE.number)}"><v>${String(entry.count)}</v></c></row>`,
      );
      row += 1;
    }

    const dominante = block.entries[0]?.accent;
    if (dominante !== undefined && row > primera) {
      bloques.push({ range: `B${String(primera)}:B${String(row - 1)}`, accent: dominante });
    }

    // Una fila en blanco entre bloques: sin ella se leen como una sola lista.
    row += 1;
  }

  return [
    XML_HEADER,
    '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">',
    `<dimension ref="A1:B${String(Math.max(row, 4))}"/>`,
    '<sheetViews><sheetView showGridLines="0" workbookViewId="0"/></sheetViews>',
    '<sheetFormatPr defaultRowHeight="15"/>',
    '<cols><col min="1" max="1" width="34" customWidth="1"/><col min="2" max="2" width="14" customWidth="1"/></cols>',
    `<sheetData>${filas.join('')}</sheetData>`,
    '<mergeCells count="2"><mergeCell ref="A1:B1"/><mergeCell ref="A2:B2"/></mergeCells>',
    ...bloques.map(barra),
    '</worksheet>',
  ].join('');
}

/** El formato condicional va **después** de `mergeCells`: lo pide el esquema. */
function barra({ range, accent }: Bloque, index: number): string {
  return [
    `<conditionalFormatting sqref="${range}">`,
    `<cfRule type="dataBar" priority="${String(index + 1)}">`,
    '<dataBar showValue="1"><cfvo type="num" val="0"/><cfvo type="max"/>',
    `<color rgb="${toArgb(accent)}"/></dataBar>`,
    '</cfRule></conditionalFormatting>',
  ].join('');
}

function banda(row: number, text: string, style: number, height: number): string {
  return [
    `<row r="${String(row)}" ht="${String(height)}" customHeight="1">`,
    texto(`A${String(row)}`, style, text),
    `<c r="B${String(row)}" s="${String(style)}"/>`,
    '</row>',
  ].join('');
}

function texto(ref: string, style: number, value: string): string {
  if (value === '') return `<c r="${ref}" s="${String(style)}"/>`;
  return `<c r="${ref}" s="${String(style)}" t="inlineStr"><is><t xml:space="preserve">${escapeXml(value)}</t></is></c>`;
}
