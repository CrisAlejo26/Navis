import type { RowData as TableRowData } from '@tanstack/react-table';
import { useTranslation } from 'react-i18next';

import { TableHeader } from '@/components/ui/table';
import { cellClass, type DataTableColumn } from '@/lib/data-table/columns';
import type { DataTableState } from '@/lib/data-table/use-data-table-state';

/**
 * La cabecera de una columna: ordena al pulsar, y con Mayús suma criterio. Dice
 * su estado a quien no la ve (`aria-sort` y una etiqueta con el sentido) y, si
 * hay varios criterios, en qué posición va.
 */
export function ColumnHeader<TItem extends TableRowData>({
    column,
    state,
}: {
    column: DataTableColumn<TItem>;
    state: DataTableState;
}) {
    const { t } = useTranslation();
    const { sorts } = state.request;
    const position = sorts.findIndex((sort) => sort.columnId === column.id);
    const sorted = sorts[position]?.dir ?? false;
    const base = t('dataTable.sortBy', { column: column.label });

    return (
        <TableHeader
            className={cellClass(column)}
            align={column.align}
            tone="solid"
            sorted={sorted}
            sortPriority={sorts.length > 1 && position >= 0 ? position + 1 : undefined}
            sortHint={t('dataTable.sortHint')}
            sortLabel={
                sorted
                    ? `${base}, ${t(sorted === 'asc' ? 'dataTable.sortAscending' : 'dataTable.sortDescending')}`
                    : base
            }
            onSort={
                column.sortable === false
                    ? undefined
                    : (event) => {
                          state.toggleSort(column.id, event.shiftKey);
                      }
            }
        >
            {column.header ?? column.label}
        </TableHeader>
    );
}
