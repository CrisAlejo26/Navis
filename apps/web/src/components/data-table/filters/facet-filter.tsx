import type { TableFilter } from '@navis/shared';
import type { RowData as TableRowData } from '@tanstack/react-table';
import { ListFilter } from 'lucide-react';
import { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { FloatingPanel } from '@/components/ui/floating-panel';
import { Tooltip } from '@/components/ui/tooltip';
import type { DataTableColumn } from '@/lib/data-table/columns';

interface FacetFilterProps<TItem extends TableRowData> {
    column: DataTableColumn<TItem>;
    filter: TableFilter | undefined;
    onChange: (filter: TableFilter | null) => void;
}

/**
 * El filtro rápido de una columna de selección: un botón propio en la barra,
 * con las opciones a un clic y cuántas hay marcadas. Es el atajo de lo que más
 * se filtra; lo demás vive en «Filtros avanzados».
 */
export function FacetFilter<TItem extends TableRowData>({
    column,
    filter,
    onChange,
}: FacetFilterProps<TItem>) {
    const { t } = useTranslation();
    const [open, setOpen] = useState(false);
    const anchor = useRef<HTMLDivElement>(null);
    const close = useCallback(() => {
        setOpen(false);
    }, []);

    const selected =
        filter?.operator === 'in' && Array.isArray(filter.value)
            ? (filter.value as unknown[]).filter((one): one is string => typeof one === 'string')
            : [];

    const toggle = (value: string, checked: boolean) => {
        const list = checked ? [...selected, value] : selected.filter((one) => one !== value);
        onChange(list.length > 0 ? { columnId: column.id, operator: 'in', value: list } : null);
    };

    return (
        <>
            <div ref={anchor} className="inline-flex">
                <Tooltip
                    label={t('dataTable.filters.filterBy', { column: column.label })}
                    description={column.description ?? t('dataTable.filters.facetHelp')}
                >
                    <Button
                        variant="outline"
                        size="sm"
                        className="max-sm:h-11"
                        aria-expanded={open}
                        aria-haspopup="dialog"
                        onClick={() => {
                            setOpen((current) => !current);
                        }}
                    >
                        <ListFilter size={16} aria-hidden className="text-primary" />
                        {column.label}
                        {selected.length > 0 && <Badge variant="primary">{selected.length}</Badge>}
                    </Button>
                </Tooltip>
            </div>
            <FloatingPanel
                anchorRef={anchor}
                open={open}
                onClose={close}
                label={t('dataTable.filters.filterBy', { column: column.label })}
                width={288}
            >
                <div className="gap-1 p-3 flex flex-col">
                    <p className="text-xs text-muted-foreground">
                        {column.description ?? t('dataTable.filters.facetHelp')}
                    </p>
                    {(column.options ?? []).map((option) => (
                        <Checkbox
                            key={option.value}
                            label={option.label}
                            hint={option.hint}
                            checked={selected.includes(option.value)}
                            onChange={(event) => {
                                toggle(option.value, event.target.checked);
                            }}
                        />
                    ))}
                </div>
            </FloatingPanel>
        </>
    );
}
