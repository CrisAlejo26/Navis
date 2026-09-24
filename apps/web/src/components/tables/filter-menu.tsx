import { ArrowLeft, Check, ListFilter } from 'lucide-react';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { summarizeFilter } from '@/lib/tables/filter-summary';
import { operatorFor } from '@/lib/tables/filters-url';
import type { CustomTableColumn, RowFilter } from '@navis/shared';

import { ColumnFilterControl } from '@/components/tables/column-filter-control';
import { FloatingPanel } from '@/components/ui/floating-panel';
import { cn } from '@/lib/cn';

/**
 * El menú «Filtro» de la barra de herramientas (D2), el modelo de Notion y
 * Airtable: ninguna columna ocupa un control de filtro en la pantalla — se
 * añaden uno a uno desde aquí, y el que ya está activo se edita en su sitio.
 */
export function FilterMenu({
    columns,
    filters,
    onChange,
}: {
    columns: readonly CustomTableColumn[];
    filters: readonly RowFilter[];
    onChange: (filters: RowFilter[]) => void;
}) {
    const { t } = useTranslation();
    const [open, setOpen] = useState(false);
    const [editando, setEditando] = useState<string | null>(null);
    const anchor = useRef<HTMLDivElement>(null);

    const filtrables = columns.filter((one) => operatorFor(one.type));
    if (filtrables.length === 0) return null;

    const activas = filtrables.filter((one) =>
        filters.some((filter) => filter.columnKey === one.key),
    );
    const sinFiltro = filtrables.filter(
        (one) => !filters.some((filter) => filter.columnKey === one.key),
    );
    const enOrden = [...activas, ...sinFiltro];

    const setFilter = (columnKey: string, filter: RowFilter | null) => {
        const sin = filters.filter((one) => one.columnKey !== columnKey);
        onChange(filter ? [...sin, filter] : sin);
    };

    return (
        <div ref={anchor} className="relative inline-flex">
            <button
                type="button"
                aria-expanded={open}
                aria-haspopup="dialog"
                onClick={() => {
                    setOpen((previous) => !previous);
                    setEditando(null);
                }}
                className={cn(
                    'h-9 gap-1.5 px-3 text-sm font-medium inline-flex cursor-pointer items-center rounded-lg border',
                    'transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
                    filters.length > 0
                        ? 'border-primary/40 bg-primary/10 text-primary'
                        : 'border-transparent bg-muted text-muted-foreground hover:text-foreground',
                )}
            >
                <ListFilter size={15} aria-hidden />
                {filters.length > 0
                    ? t('tables.filters.addWithCount', { count: filters.length })
                    : t('tables.filters.add')}
            </button>

            <FloatingPanel
                open={open}
                onClose={() => {
                    setOpen(false);
                    setEditando(null);
                }}
                anchorRef={anchor}
                label={t('tables.filters.panelTitle')}
                className="p-1.5 max-h-80 overflow-y-auto"
            >
                {editando !== null ? (
                    <div className="p-2 gap-2 flex flex-col">
                        <button
                            type="button"
                            onClick={() => {
                                setEditando(null);
                            }}
                            className="gap-1.5 text-xs inline-flex cursor-pointer items-center self-start text-muted-foreground hover:text-foreground"
                        >
                            <ArrowLeft size={13} aria-hidden />
                            {t('tables.filters.backToColumns')}
                        </button>

                        {filtrables
                            .filter((one) => one.key === editando)
                            .map((column) => (
                                <ColumnFilterControl
                                    key={column.key}
                                    column={column}
                                    filter={filters.find((one) => one.columnKey === column.key)}
                                    label={column.label}
                                    onChange={(filter) => {
                                        setFilter(column.key, filter);
                                    }}
                                />
                            ))}
                    </div>
                ) : (
                    <ul>
                        {enOrden.map((column) => {
                            const activo = filters.find((one) => one.columnKey === column.key);
                            return (
                                <button
                                    key={column.key}
                                    type="button"
                                    onClick={() => {
                                        setEditando(column.key);
                                    }}
                                    className="gap-2 px-2.5 py-2 flex w-full cursor-pointer items-center rounded-lg text-left hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                                >
                                    <Check
                                        size={14}
                                        aria-hidden
                                        className={cn(
                                            'shrink-0',
                                            activo ? 'text-primary' : 'opacity-0',
                                        )}
                                    />
                                    <span className="min-w-0 flex-1">
                                        <span className="text-sm leading-tight block truncate">
                                            {column.label}
                                        </span>
                                        {activo && (
                                            <span className="text-xs block truncate text-muted-foreground">
                                                {summarizeFilter(activo, column, t)}
                                            </span>
                                        )}
                                    </span>
                                </button>
                            );
                        })}
                    </ul>
                )}
            </FloatingPanel>
        </div>
    );
}
