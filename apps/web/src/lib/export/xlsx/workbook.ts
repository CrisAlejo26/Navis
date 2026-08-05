import type { ExportDocument } from '@/lib/export/document';
import { buildSummary } from '@/lib/export/summary';
import { collectAccents } from '@/lib/export/xlsx/palette';
import { buildDataSheet } from '@/lib/export/xlsx/sheet';
import { buildStyles } from '@/lib/export/xlsx/styles';
import { buildSummarySheet } from '@/lib/export/xlsx/summary-sheet';
import { escapeXml, XML_HEADER } from '@/lib/export/xlsx/xml';
import { buildZip, utf8, type ZipEntry } from '@/lib/export/zip';

const NS_PKG = 'http://schemas.openxmlformats.org/package/2006/relationships';
const NS_REL = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
const NS_SHEET = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main';
const TIPO = 'application/vnd.openxmlformats-officedocument.spreadsheetml';

export const XLSX_MIME = `${TIPO}.sheet`;

export interface XlsxLabels {
  /** El nombre de la primera pestaña: «Creyentes». */
  sheet: string;
  /** El de la segunda: «Resumen». */
  summary: string;
  /** La banda de la hoja de resumen. */
  summaryTitle: string;
  /** Lo que pone debajo: «47 filas». */
  rows: string;
  /** Cómo se llama la ausencia de dato: «Sin asignar». */
  empty: string;
}

/**
 * El `.xlsx` entero, escrito a mano (RFC 0009 D5).
 *
 * Son siete ficheros XML dentro de un ZIP sin comprimir. Lo delicado no es
 * escribirlos, es que Excel los abra: el orden de los elementos y las
 * relaciones entre partes son estrictos, y por eso hay un test que
 * descomprime lo generado y comprueba que están las siete.
 */
export function toXlsx(doc: ExportDocument, labels: XlsxLabels): Blob {
  const summary = buildSummary(doc, labels.empty);
  const styles = buildStyles(collectAccents(doc, summary));
  const conResumen = summary.length > 0;

  const hojas = [
    { name: labels.sheet, xml: buildDataSheet(doc, styles) },
    ...(conResumen
      ? [
          {
            name: labels.summary,
            xml: buildSummarySheet(doc, summary, styles, {
              title: labels.summaryTitle,
              rows: labels.rows,
            }),
          },
        ]
      : []),
  ];

  const entries: ZipEntry[] = [
    entry('[Content_Types].xml', contentTypes(hojas.length)),
    entry('_rels/.rels', rels([{ id: 'rId1', type: 'officeDocument', target: 'xl/workbook.xml' }])),
    entry('xl/workbook.xml', workbook(hojas.map((hoja) => hoja.name))),
    entry('xl/_rels/workbook.xml.rels', workbookRels(hojas.length)),
    entry('xl/styles.xml', styles.xml),
    ...hojas.map((hoja, index) => entry(`xl/worksheets/sheet${String(index + 1)}.xml`, hoja.xml)),
  ];

  return buildZip(entries, XLSX_MIME);
}

function entry(name: string, xml: string): ZipEntry {
  return { name, data: utf8(xml) };
}

function contentTypes(sheets: number): string {
  const hojas = Array.from(
    { length: sheets },
    (_unused, index) =>
      `<Override PartName="/xl/worksheets/sheet${String(index + 1)}.xml" ContentType="${TIPO}.worksheet+xml"/>`,
  ).join('');

  return [
    XML_HEADER,
    '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">',
    '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>',
    '<Default Extension="xml" ContentType="application/xml"/>',
    `<Override PartName="/xl/workbook.xml" ContentType="${TIPO}.sheet.main+xml"/>`,
    `<Override PartName="/xl/styles.xml" ContentType="${TIPO}.styles+xml"/>`,
    hojas,
    '</Types>',
  ].join('');
}

function rels(items: readonly { id: string; type: string; target: string }[]): string {
  const relaciones = items
    .map(
      (item) =>
        `<Relationship Id="${item.id}" Type="${NS_REL}/${item.type}" Target="${item.target}"/>`,
    )
    .join('');

  return `${XML_HEADER}<Relationships xmlns="${NS_PKG}">${relaciones}</Relationships>`;
}

function workbookRels(sheets: number): string {
  const hojas = Array.from({ length: sheets }, (_unused, index) => ({
    id: `rId${String(index + 1)}`,
    type: 'worksheet',
    target: `worksheets/sheet${String(index + 1)}.xml`,
  }));

  return rels([...hojas, { id: `rId${String(sheets + 1)}`, type: 'styles', target: 'styles.xml' }]);
}

function workbook(names: readonly string[]): string {
  const hojas = names
    .map(
      (name, index) =>
        `<sheet name="${escapeXml(sheetName(name))}" sheetId="${String(index + 1)}" r:id="rId${String(index + 1)}"/>`,
    )
    .join('');

  return [
    XML_HEADER,
    `<workbook xmlns="${NS_SHEET}" xmlns:r="${NS_REL}">`,
    `<sheets>${hojas}</sheets>`,
    '</workbook>',
  ].join('');
}

/**
 * Excel no acepta pestañas de más de 31 caracteres ni con `[ ] : * ? / \`
 * dentro, y si alguna se cuela el fichero no abre. El nombre lo pone una
 * traducción, así que se sanea aquí y no se confía en que nadie se acuerde.
 */
function sheetName(name: string): string {
  const limpio = name.replace(/[[\]:*?/\\]/g, ' ').trim();
  return (limpio || 'Hoja').slice(0, 31);
}
