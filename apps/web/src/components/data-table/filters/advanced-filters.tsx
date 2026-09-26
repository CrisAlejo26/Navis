import type { TableFilter } from '@navis/shared';
import type { RowData as TableRowData } from '@tanstack/react-table';
import { SlidersHorizontal } from 'lucide-react';
import { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { AdvancedRow } from '@/components/data-table/filters/advanced-row';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Drawer } from '@/components/ui/drawer';
import { FloatingPanel } from '@/components/ui/floating-panel';
import { Tooltip } from '@/components/ui/tooltip';
import type { DataTableColumn } from '@/lib/data-table/columns';
import { useMediaQuery } from '@/lib/use-media-query';

interface AdvancedFiltersProps<TItem extends TableRowData> {
    /** Solo las columnas filtrables. */
    columns: readonly DataTableColumn<TItem>[];
    filters: readonly TableFilter[];
    onSetFilter: (columnId: string, filter: TableFilter | null) => void;
    onClear: () => void;
}

/**
 * «Filtros avanzados»: una condición por cada columna filtrable, todas a la
 * vez. En escritorio es un panel anclado al botón; en un teléfono, un cajón
 * lateral (Regla 5), como los filtros de creyentes.
 */
export function AdvancedFilters<TItem extends TableRowData>({
    columns,
    filters,
    onSetFilter,
    onClear,
}: AdvancedFiltersProps<TItem>) {
    const { t } = useTranslation();
    const [open, setOpen] = useState(false);
    const anchor = useRef<HTMLDivElement>(null);
    const isNarrow = useMediaQuery('(max-width: 767px)');
    const close = useCallback(() => {
        setOpen(false);
    }, []);
    const active = filters.filter((filter) => columns.some((c) => c.id === filter.columnId));

    const content = (
        <div className="gap-1 p-4 flex flex-col">
            <p className="text-xs text-muted-foreground">{t('dataTable.filters.advancedHint')}</p>
            <ul className="divide-y">
                {columns.map((column) => (
                    <AdvancedRow
                        key={column.id}
                        column={column}
                        filter={filters.find((filter) => filter.columnId === column.id)}
                        onChange={(filter) => {
                            onSetFilter(column.id, filter);
                        }}
                    />
                ))}
            </ul>
            {active.length > 0 && (
                <Button variant="ghost" size="sm" onClick={onClear}>
                    {t('dataTable.filters.clearAll')}
                </Button>
            )}
        </div>
    );

    return (
        <>
            <div ref={anchor} className="inline-flex">
                <Tooltip
                    label={t('dataTable.filters.advanced')}
                    description={t('dataTable.filters.advancedHelp')}
                >
                    <Button
                        variant="outline"
                        size="sm"
                        className="max-sm:h-11 max-sm:px-3"
                        aria-expanded={open}
                        aria-haspopup="dialog"
                        onClick={() => {
                            setOpen((current) => !current);
                        }}
                    >
                        <SlidersHorizontal size={16} aria-hidden className="text-primary" />
                        <span className="max-sm:sr-only">{t('dataTable.filters.advanced')}</span>
                        {active.length > 0 && <Badge variant="primary">{active.length}</Badge>}
                    </Button>
                </Tooltip>
            </div>

            {isNarrow ? (
                <Drawer
                    open={open}
                    side="right"
                    width="min(24rem, 92vw)"
                    title={t('dataTable.filters.advanced')}
                    onClose={close}
                >
                    {content}
                </Drawer>
            ) : (
                <FloatingPanel
                    anchorRef={anchor}
                    open={open}
                    onClose={close}
                    label={t('dataTable.filters.advanced')}
                    width={380}
                >
                    <div className="max-h-[min(60dvh,32rem)] overflow-y-auto">{content}</div>
                </FloatingPanel>
            )}
        </>
    );
}
