/**
 * Los doce tipos de columna de una tabla personalizada (RFC 0021 §«Los tipos
 * de columna»).
 *
 * Selección única y selección múltiple son **un tipo cada una**, no dos por
 * forma de pintarse (D11): la interfaz decide radios o desplegable según
 * cuántas opciones tenga la columna, no quien la crea.
 */
export const TABLE_COLUMN_TYPES = [
  'text',
  'long_text',
  'number',
  'currency',
  'checkbox',
  'date',
  'single_select',
  'multi_select',
  'email',
  'phone',
  'url',
  'password',
] as const;

export type TableColumnType = (typeof TABLE_COLUMN_TYPES)[number];

export function isTableColumnType(value: string): value is TableColumnType {
  return (TABLE_COLUMN_TYPES as readonly string[]).includes(value);
}

/** Tipos cuyo valor es texto libre, filtrado con «contiene» (D28). */
export const TEXT_LIKE_COLUMN_TYPES: readonly TableColumnType[] = [
  'text',
  'long_text',
  'email',
  'phone',
  'url',
];

/** Tipos numéricos, filtrados y ordenados con `CAST` (D15). */
export const NUMERIC_COLUMN_TYPES: readonly TableColumnType[] = ['number', 'currency'];

/** Tipos de selección, con su catálogo de `options` (D11, D28). */
export const SELECT_COLUMN_TYPES: readonly TableColumnType[] = ['single_select', 'multi_select'];

/** Como referencia de Airtable y Baserow, para que la pantalla no se rompa sola (D12). */
export const MAX_TABLE_COLUMNS = 30;
export const MAX_SELECT_OPTIONS = 50;

/** Con seis opciones o menos, radios/casillas; con más, un desplegable (D11). */
export const SELECT_RADIO_THRESHOLD = 6;
