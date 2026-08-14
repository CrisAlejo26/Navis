import {
  columnConfigSchema,
  columnOptionSchema,
  columnTypeSchema,
  type CustomTable as CustomTableView,
  type CustomTableColumn as CustomTableColumnView,
} from '@navis/shared';
import { z } from 'zod';

import type { CustomTableColumn } from './custom-table-column.entity';
import type { CustomTable } from './custom-table.entity';

const optionsSchema = z.array(columnOptionSchema);

export function toCustomTableView(table: CustomTable): CustomTableView {
  return {
    id: table.id,
    churchId: table.churchId,
    name: table.name,
    slug: table.slug,
    icon: table.icon,
    accent: table.accent,
    position: table.position,
    isActive: table.isActive,
  };
}

/**
 * `options`/`config` viven como texto JSON en la columna (D13): se leen y se
 * validan con su esquema zod, nunca con un `JSON.parse` a pelo (Regla 10).
 */
export function toColumnView(column: CustomTableColumn): CustomTableColumnView {
  return {
    id: column.id,
    tableId: column.tableId,
    key: column.key,
    label: column.label,
    // Solo se escribe a través de `@IsIn(TABLE_COLUMN_TYPES)`, pero se valida
    // igual que `options`/`config` en vez de un `as` a ciegas (Regla 10).
    type: columnTypeSchema.catch('text').parse(column.type),
    position: column.position,
    required: column.required,
    options: parseJson(column.options, optionsSchema),
    config: parseJson(column.config, columnConfigSchema),
    isActive: column.isActive,
  };
}

function parseJson<T>(raw: string | null, schema: z.ZodType<T>): T | null {
  if (!raw) return null;

  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return null;
  }

  const parsed = schema.safeParse(value);
  return parsed.success ? parsed.data : null;
}
