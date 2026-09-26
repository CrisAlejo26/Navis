import type { TableFilter } from '@navis/shared';
import type { RowData as TableRowData } from '@tanstack/react-table';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { useFilterText } from '@/components/data-table/filters/use-filter-text';
import { Button } from '@/components/ui/button';
import type { DataTableColumn } from '@/lib/data-table/columns';

/**
 * Los filtros que están puestos, uno por chip y cada uno con su ×. Una tabla
 * filtrada tiene que verse filtrada: sin esto, quien vuelve a la pantalla cree
 * que faltan datos. Desaparece cuando no hay ninguno.
 */
export function FilterChips<TItem extends TableRowData>({
    filters,
    columns,
    onRemove,
    onClear,
}: {
    filters: readonly TableFilter[];
    columns: readonly DataTableColumn<TItem>[];
    onRemove: (filter: TableFilter) => void;
    onClear: () => void;
}) {
    const { t } = useTranslation();
    const filterText = useFilterText();
    const byId = new Map(columns.map((column) => [column.id, column]));
    const shown = filters.filter((filter) => byId.has(filter.columnId));
    if (shown.length === 0) return null;

    return (
        <ul
            aria-label={t('dataTable.filters.active')}
            className="gap-2 flex flex-wrap items-center"
        >
            {shown.map((filter) => {
                const column = byId.get(filter.columnId);
                if (!column) return null;
                const text = filterText(filter, column);
                return (
                    <li
                        key={`${filter.columnId}:${filter.operator}:${JSON.stringify(filter.value)}`}
                    >
                        <button
                            type="button"
                            aria-label={t('dataTable.filters.removeOne', { label: text })}
                            onClick={() => {
                                onRemove(filter);
                            }}
                            className="h-7 gap-1.5 pr-1.5 pl-3 text-xs font-medium inline-flex max-w-full cursor-pointer items-center rounded-full border border-primary/25 bg-primary/10 text-primary transition-colors hover:bg-primary/15 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                        >
                            <span className="truncate">{text}</span>
                            <X size={13} aria-hidden className="shrink-0" />
                        </button>
                    </li>
                );
            })}
            <li>
                <Button variant="ghost" size="sm" className="text-destructive" onClick={onClear}>
                    {t('dataTable.filters.clearAll')}
                </Button>
            </li>
        </ul>
    );
}
