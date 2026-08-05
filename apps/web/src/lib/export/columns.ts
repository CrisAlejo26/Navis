/**
 * Cómo se describe una columna de una exportación (RFC 0009 D7).
 *
 * Los cinco escritores —Excel, PDF, imagen, Markdown y CSV— leen **esto** y
 * ninguno sabe qué es un creyente. Es lo que hace que añadir un módulo sea
 * escribir sus columnas y nada más.
 *
 * Las columnas de cada módulo se construyen en un **hook** (`useBelieverExportColumns`
 * y sus hermanos) y no en una función suelta: así los encabezados y las
 * etiquetas se traducen con el `t` del componente y no hay que pasearlo por
 * ninguna firma.
 */
export type ExportAlign = 'left' | 'right';

/**
 * El gris de lo que no tiene color propio: un estado neutro, la ausencia de un
 * dato. No es un acento más, es la falta de uno.
 */
export const NEUTRAL_ACCENT = '#636975';

/** Un valor con color propio: un estado, un don, una labor, una emoción. */
export interface ExportTag {
  text: string;
  /** Token de la paleta o `#rrggbb`, como en el resto de la aplicación. */
  accent: string;
}

/**
 * Una celda, por lo que **es** y no por cómo se pinta.
 *
 * `day` existe aparte de `text` a propósito: un día de calendario es
 * `AAAA-MM-DD` y convertirlo con `new Date(iso)` lo pinta el día anterior al
 * oeste de Greenwich (CLAUDE.md). Separándolo, ningún escritor tiene la
 * tentación: cada uno lo trata como lo que es —fecha de verdad en Excel, texto
 * formateado en UTC en los demás—.
 */
export type ExportCell =
  | { kind: 'text'; text: string }
  | { kind: 'number'; value: number }
  | { kind: 'day'; iso: string }
  | { kind: 'tags'; tags: ExportTag[] };

export interface ExportColumn<TRow> {
  key: string;
  /** Ya traducido: lo pone el hook que construye las columnas. */
  header: string;
  value: (row: TRow) => ExportCell;
  /** Ancho sugerido en caracteres. Sin él se calcula del contenido. */
  width?: number;
  align?: ExportAlign;
}

export function cellText(value: string | null | undefined): ExportCell {
  return { kind: 'text', text: value?.trim() ?? '' };
}

export function cellNumber(value: number): ExportCell {
  return { kind: 'number', value };
}

/** Un día de calendario. Vacío se queda en texto: una fecha nula no es fecha. */
export function cellDay(iso: string | null | undefined): ExportCell {
  return iso ? { kind: 'day', iso } : { kind: 'text', text: '' };
}

export function cellTags(tags: readonly ExportTag[]): ExportCell {
  return { kind: 'tags', tags: [...tags] };
}

/** Una sola etiqueta, que es el caso de un estado. */
export function cellTag(text: string, accent: string): ExportCell {
  return { kind: 'tags', tags: [{ text, accent }] };
}
