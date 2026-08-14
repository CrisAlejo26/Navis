import { BadRequestException } from '@nestjs/common';
import {
  rowValueMatchesType,
  rowValueMissing,
  type ColumnOption,
  type RowData,
  type TableColumnType,
} from '@navis/shared';

import { encryptTableField } from './table-field-crypto';

type ColumnLike = {
  key: string;
  label: string;
  type: TableColumnType;
  required: boolean;
  options: ColumnOption[] | null;
};

/**
 * Funde lo que llega con lo que ya había, valida cada valor contra el tipo
 * actual de su columna y cifra las contraseñas antes de guardar (D9, D13,
 * D21).
 *
 * Es una fusión y no un reemplazo: un `PATCH` que no toca una columna —el caso
 * normal de una contraseña que no ha cambiado— conserva lo que ya estaba, sin
 * volver a cifrar nada.
 */
export function prepareRowData(
  columns: readonly ColumnLike[],
  incoming: RowData,
  existing: RowData,
): RowData {
  const merged: RowData = { ...existing };

  for (const [key, value] of Object.entries(incoming)) {
    const column = columns.find((one) => one.key === key);
    if (!column) continue; // una clave que no es de ninguna columna activa se ignora

    if (value === null || value === undefined) {
      delete merged[key];
      continue;
    }

    if (!rowValueMatchesType(column, value)) {
      throw new BadRequestException(`El valor de «${column.label}» no encaja con su tipo`);
    }

    merged[key] =
      column.type === 'password' && typeof value === 'string' ? encryptTableField(value) : value;
  }

  for (const column of columns) {
    if (rowValueMissing(column.required, merged[column.key])) {
      throw new BadRequestException(`«${column.label}» es obligatorio`);
    }
  }

  return merged;
}
