import type { FilterOperator, TableColumnType } from '@navis/shared';

import { NUMERIC_TYPES, TEXT_TYPES } from '@/lib/tables/column-types';

/**
 * El operador que le toca a un tipo de columna: el mismo reparto que hace la
 * API en `table-row-filters.ts` (RFC 0021 D30). La contraseña no tiene
 * operador: no se puede filtrar (D29).
 */
export function operatorFor(type: TableColumnType): FilterOperator | undefined {
    if (TEXT_TYPES.has(type)) return 'contains';
    if (NUMERIC_TYPES.has(type)) return 'between';
    if (type === 'date') return 'between';
    if (type === 'checkbox') return 'equals';
    if (type === 'single_select' || type === 'multi_select') return 'in';
    return undefined;
}
