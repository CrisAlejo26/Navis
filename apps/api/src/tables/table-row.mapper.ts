import {
  rowDataSchema,
  rowValueMatchesType,
  type CustomTableColumn,
  type CustomTableRow as CustomTableRowView,
  type RowData,
} from '@navis/shared';

import type { CustomTableRow } from './custom-table-row.entity';

/** El JSON de `data`, validado con zod (D13): nunca un `JSON.parse` a pelo. */
export function parseRowData(raw: string): RowData {
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return {};
  }

  const parsed = rowDataSchema.safeParse(value);
  return parsed.success ? parsed.data : {};
}

/**
 * La fila lista para el cliente: solo las columnas activas, con las que no
 * encajan con el tipo actual marcadas (D9) y las contraseñas ocultas (D22).
 */
export function toRowView(
  row: CustomTableRow,
  activeColumns: readonly Pick<CustomTableColumn, 'key' | 'type' | 'options'>[],
): CustomTableRowView {
  const raw = parseRowData(row.data);
  const mismatches: string[] = [];
  const data: RowData = {};

  for (const column of activeColumns) {
    if (!(column.key in raw)) continue;
    const value = raw[column.key];

    if (!rowValueMatchesType(column, value)) mismatches.push(column.key);
    data[column.key] = column.type === 'password' ? hasValue(value) : value;
  }

  return {
    id: row.id,
    tableId: row.tableId,
    data,
    mismatches,
    createdBy: row.createdBy,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

/** Ni el valor ni su longitud: solo si hay algo que revelar (D22). */
function hasValue(value: unknown): boolean {
  return typeof value === 'string' && value.length > 0;
}
