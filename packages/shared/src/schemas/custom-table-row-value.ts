import { NUMERIC_COLUMN_TYPES, TEXT_LIKE_COLUMN_TYPES } from '../constants/table-column-types';
import { isoDateSchema } from './common';
import type { ColumnOption, CustomTableColumn } from './custom-table-columns';

/**
 * Si un valor de fila **encaja** con el tipo actual de su columna (RFC 0021
 * D9).
 *
 * Se usa dos veces con dos consecuencias distintas: al **guardar** una fila,
 * un valor que no encaja se rechaza (400); al **leer** una fila tras cambiar
 * el tipo de una columna que ya tenía datos, un valor que no encaja no se
 * toca ni se borra — se marca como «no encaja» y sigue editable en crudo. Esa
 * segunda parte la resuelve quien llama, comparando esta función con el valor
 * ya guardado; aquí solo vive la comprobación.
 */
export function rowValueMatchesType(
  column: Pick<CustomTableColumn, 'type' | 'options'>,
  value: unknown,
): boolean {
  if (value === null || value === undefined) return true;

  if (TEXT_LIKE_COLUMN_TYPES.includes(column.type) || column.type === 'password') {
    return typeof value === 'string';
  }
  if (NUMERIC_COLUMN_TYPES.includes(column.type)) {
    return typeof value === 'number' && Number.isFinite(value);
  }
  if (column.type === 'checkbox') return typeof value === 'boolean';
  if (column.type === 'date')
    return typeof value === 'string' && isoDateSchema.safeParse(dayOf(value)).success;

  if (column.type === 'single_select') {
    return typeof value === 'string' && optionsOf(column.options).includes(value);
  }
  if (column.type === 'multi_select') {
    const opciones = optionsOf(column.options);
    return (
      Array.isArray(value) &&
      value.every((one) => typeof one === 'string' && opciones.includes(one))
    );
  }

  return false;
}

/** La parte de fecha, tanto si viene `AAAA-MM-DD` como con hora incluida. */
function dayOf(value: string): string {
  return value.slice(0, 10);
}

function optionsOf(options: readonly ColumnOption[] | null): string[] {
  return (options ?? []).map((one) => one.value);
}

/** Si `required` exige algo y la fila no trae nada para esa columna. */
export function rowValueMissing(required: boolean, value: unknown): boolean {
  if (!required) return false;
  if (value === null || value === undefined || value === '') return true;
  return Array.isArray(value) && value.length === 0;
}
