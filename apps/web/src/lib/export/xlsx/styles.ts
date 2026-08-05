import { BRAND, RULE, SUBTITLE_BG, tint, toArgb, ZEBRA } from '@/lib/export/xlsx/palette';
import { XML_HEADER } from '@/lib/export/xlsx/xml';

/**
 * Los estilos fijos, por su índice en `cellXfs`. Los de etiqueta van después y
 * dependen de cuántos acentos tenga el documento (`tagStyle`).
 */
export const STYLE = {
  default: 0,
  /** La banda azul de arriba: blanco, negrita y 16 puntos. */
  title: 1,
  /** La línea de filtros, sobre el mismo azul al 8 %. */
  subtitle: 2,
  /** La fila de encabezados: azul de marca y texto blanco (RFC 0009 §8.1). */
  header: 3,
  text: 4,
  textAlt: 5,
  number: 6,
  numberAlt: 7,
  date: 8,
  dateAlt: 9,
  /** El rótulo de un bloque de la hoja «Resumen». */
  blockHeader: 10,
} as const;

const FIRST_TAG_STYLE = 11;

export interface XlsxStyles {
  xml: string;
  /** El estilo de una celda de etiquetas con ese acento. */
  tagStyle: (accent: string) => number;
}

/**
 * `styles.xml` completo, con una fuente y un relleno por acento.
 *
 * El orden de los elementos no es negociable: el esquema de OOXML pide
 * `fonts`, `fills`, `borders`, `cellStyleXfs`, `cellXfs` y `cellStyles`, en ese
 * orden. Con uno fuera de sitio Excel no abre el fichero, y ese es el riesgo
 * real de escribirlo a mano (RFC 0009 D5).
 */
export function buildStyles(accents: readonly string[]): XlsxStyles {
  const indices = new Map(accents.map((accent, index) => [accent, index]));

  const fonts = [
    '<font><sz val="10"/><name val="Calibri"/></font>',
    `<font><sz val="16"/><b/><color rgb="FFFFFFFF"/><name val="Calibri"/></font>`,
    '<font><sz val="9"/><color rgb="FF3A3F55"/><name val="Calibri"/></font>',
    `<font><sz val="11"/><b/><color rgb="FFFFFFFF"/><name val="Calibri"/></font>`,
    `<font><sz val="10"/><b/><color rgb="${BRAND}"/><name val="Calibri"/></font>`,
    ...accents.map(
      (accent) =>
        `<font><sz val="10"/><color rgb="${toArgb(accent)}"/><name val="Calibri"/></font>`,
    ),
  ];

  const fills = [
    '<fill><patternFill patternType="none"/></fill>',
    '<fill><patternFill patternType="gray125"/></fill>',
    solid(BRAND),
    solid(SUBTITLE_BG),
    solid(ZEBRA),
    ...accents.map((accent) => solid(tint(accent))),
  ];

  const borders = [
    '<border><left/><right/><top/><bottom/><diagonal/></border>',
    `<border><left/><right/><top/><bottom style="thin"><color rgb="${RULE}"/></bottom><diagonal/></border>`,
  ];

  const cellXfs = [
    xf({ font: 0 }),
    xf({ font: 1, fill: 2, vertical: 'center' }),
    xf({ font: 2, fill: 3, vertical: 'center' }),
    xf({ font: 3, fill: 2, vertical: 'center', wrap: true }),
    xf({ font: 0, border: 1, vertical: 'top', wrap: true }),
    xf({ font: 0, fill: 4, border: 1, vertical: 'top', wrap: true }),
    xf({ font: 0, border: 1, vertical: 'top', horizontal: 'right' }),
    xf({ font: 0, fill: 4, border: 1, vertical: 'top', horizontal: 'right' }),
    xf({ font: 0, border: 1, vertical: 'top', numFmt: 14 }),
    xf({ font: 0, fill: 4, border: 1, vertical: 'top', numFmt: 14 }),
    xf({ font: 4, border: 1, vertical: 'center' }),
    ...accents.map((_accent, index) =>
      xf({ font: 5 + index, fill: 5 + index, border: 1, vertical: 'top', wrap: true }),
    ),
  ];

  return {
    xml: [
      XML_HEADER,
      '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">',
      lista('fonts', fonts),
      lista('fills', fills),
      lista('borders', borders),
      '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>',
      lista('cellXfs', cellXfs),
      '<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>',
      '</styleSheet>',
    ].join(''),
    // Un acento que no estuviera en la lista cae al estilo de texto normal: es
    // preferible una celda sin color a un fichero que Excel no abre.
    tagStyle: (accent) => {
      const index = indices.get(accent);
      return index === undefined ? STYLE.text : FIRST_TAG_STYLE + index;
    },
  };
}

function solid(argb: string): string {
  return `<fill><patternFill patternType="solid"><fgColor rgb="${argb}"/><bgColor indexed="64"/></patternFill></fill>`;
}

function lista(tag: string, items: readonly string[]): string {
  return `<${tag} count="${String(items.length)}">${items.join('')}</${tag}>`;
}

function xf(options: {
  font: number;
  fill?: number;
  border?: number;
  numFmt?: number;
  vertical?: 'top' | 'center';
  horizontal?: 'right';
  wrap?: boolean;
}): string {
  const alignment =
    options.vertical || options.horizontal || options.wrap
      ? `<alignment${options.horizontal ? ` horizontal="${options.horizontal}"` : ''}${
          options.vertical ? ` vertical="${options.vertical}"` : ''
        }${options.wrap ? ' wrapText="1"' : ''}/>`
      : '';

  const attrs = [
    `numFmtId="${String(options.numFmt ?? 0)}"`,
    `fontId="${String(options.font)}"`,
    `fillId="${String(options.fill ?? 0)}"`,
    `borderId="${String(options.border ?? 0)}"`,
    'xfId="0"',
    options.numFmt ? 'applyNumberFormat="1"' : '',
    'applyFont="1"',
    options.fill ? 'applyFill="1"' : '',
    options.border ? 'applyBorder="1"' : '',
    alignment ? 'applyAlignment="1"' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return alignment ? `<xf ${attrs}>${alignment}</xf>` : `<xf ${attrs}/>`;
}
