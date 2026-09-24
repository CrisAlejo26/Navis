import { X } from 'lucide-react';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { CustomTableColumn, RowFilter } from '@navis/shared';

import { summarizeFilter } from '@/lib/tables/filter-summary';
import { withFilter } from '@/lib/tables/filters';
import { ColumnFilterControl } from '@/components/tables/column-filter-control';
import { FloatingPanel } from '@/components/ui/floating-panel';
import { ClearFiltersButton } from '@/components/ui/clear-filters-button';
import { cn } from '@/lib/cn';

/**
 * Los filtros activos, uno por chip (D3): la columna con su resumen, el clic
 * lo reabre para afinarlo y la X lo quita. La fila entera desaparece cuando
 * no hay ninguno — la tabla vuelve a quedarse sola.
 */
export function ActiveFiltersRow({
    columns,
    filters,
    onChange,
}: {
    columns: readonly CustomTableColumn[];
    filters: readonly RowFilter[];
    onChange: (filters: RowFilter[]) => void;
}) {
    const { t } = useTranslation();
    const byKey = new Map(columns.map((one) => [one.key, one]));

    if (filters.length === 0) return null;

    return (
        <div className="gap-2 animate-chip-in flex flex-wrap items-center">
            {filters.map((filter) => {
                const column = byKey.get(filter.columnKey);
                if (!column) return null;

                return (
                    <span key={column.key} className="gap-0.5 inline-flex items-center">
                        <FilterChip
                            column={column}
                            filter={filter}
                            filters={filters}
                            onChange={onChange}
                        />
                        <button
                            type="button"
                            aria-label={t('tables.filters.removeAria', { label: column.label })}
                            className="h-8 w-8 inline-flex cursor-pointer items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                            onClick={() => {
                                onChange(withFilter(filters, column.key, null));
                            }}
                        >
                            <X size={14} aria-hidden />
                        </button>
                    </span>
                );
            })}

            <ClearFiltersButton
                count={filters.length}
                onClear={() => {
                    onChange([]);
                }}
            />
        </div>
    );
}

/** El chip que, al pulsarlo, reabre el control de esa columna para ajustarlo. */
function FilterChip({
    column,
    filter,
    filters,
    onChange,
}: {
    column: CustomTableColumn;
    filter: RowFilter;
    filters: readonly RowFilter[];
    onChange: (filters: RowFilter[]) => void;
}) {
    const { t } = useTranslation();
    const anchor = useRef<HTMLSpanElement>(null);
    const [open, setOpen] = useState(false);

    return (
        <span ref={anchor} className="inline-flex">
            <button
                type="button"
                aria-expanded={open}
                aria-haspopup="dialog"
                className={cn(
                    'h-8 gap-1.5 px-3 text-xs font-medium inline-flex cursor-pointer items-center rounded-full border',
                    'border-primary/40 bg-primary/10 text-primary transition-colors duration-200',
                    'focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
                )}
                onClick={() => {
                    setOpen((previous) => !previous);
                }}
            >
                <span className="max-w-32 truncate">{column.label}</span>
                <span aria-hidden className="opacity-50">
                    ·
                </span>
                <span className="max-w-40 truncate">{summarizeFilter(filter, column, t)}</span>
            </button>

            <FloatingPanel
                open={open}
                onClose={() => {
                    setOpen(false);
                }}
                anchorRef={anchor}
                label={column.label}
                className="p-3"
            >
                <ColumnFilterControl
                    column={column}
                    filter={filter}
                    label={column.label}
                    onChange={(next) => {
                        onChange(withFilter(filters, column.key, next));
                        // Si al ajustar el filtro se queda vacío, el chip ya no tiene
                        // nada que enseñar: se cierra y desaparece.
                        if (next === null) setOpen(false);
                    }}
                />
            </FloatingPanel>
        </span>
    );
}
