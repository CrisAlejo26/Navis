import { z } from 'zod';
import {
  rowFiltersSchema,
  TABLE_VIEW_TYPES,
  type CustomTableView as CustomTableViewShape,
} from '@navis/shared';

import type { CustomTableView } from './custom-table-view.entity';

const typeSchema = z.enum(TABLE_VIEW_TYPES).catch('grid');
const sortOrderSchema = z.enum(['asc', 'desc']).catch('desc');

/** `type`/`sort_order`/`filters` viven como texto en la fila; se validan con zod (Regla 10). */
export function toViewShape(view: CustomTableView): CustomTableViewShape {
  let value: unknown;
  try {
    value = JSON.parse(view.filters);
  } catch {
    value = [];
  }
  const filters = rowFiltersSchema.safeParse(value);

  return {
    id: view.id,
    tableId: view.tableId,
    name: view.name,
    type: typeSchema.parse(view.type),
    groupBy: view.groupBy,
    dateColumn: view.dateColumn,
    filters: filters.success ? filters.data : [],
    sortBy: view.sortBy,
    sortOrder: sortOrderSchema.parse(view.sortOrder),
    position: view.position,
  };
}
