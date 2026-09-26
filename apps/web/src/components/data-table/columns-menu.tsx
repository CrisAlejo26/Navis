import type { RowData as TableRowData } from '@tanstack/react-table';
import { ChevronDown, ChevronUp, Columns3 } from 'lucide-react';
import { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Chip } from '@/components/ui/chip';
import { FloatingPanel } from '@/components/ui/floating-panel';
import { IconAction } from '@/components/ui/icon-action';
import { Tooltip } from '@/components/ui/tooltip';
import type { DataTableColumn } from '@/lib/data-table/columns';
import { TABLE_DENSITIES } from '@/lib/data-table/types';
import { defaultPreferences } from '@/lib/data-table/table-preferences';
import type { DataTableState } from '@/lib/data-table/use-data-table-state';

/**
 * «Columnas»: qué columnas se ven y en qué orden. Solo entran las que se pueden
 * ocultar (nombre y acciones no: sin ellas la fila deja de entenderse). Todo se
 * guarda en las preferencias del usuario, así que la próxima visita vuelve igual.
 *
 * El orden se cambia con flechas y no arrastrando: un botón se alcanza con el
 * teclado y con el pulgar, un arrastre no.
 */
export function ColumnsMenu<TItem extends TableRowData>({
    columns,
    state,
}: {
    columns: readonly DataTableColumn<TItem>[];
    state: DataTableState;
}) {
    const { t } = useTranslation();
    const [open, setOpen] = useState(false);
    const anchor = useRef<HTMLDivElement>(null);
    const close = useCallback(() => {
        setOpen(false);
    }, []);

    const densityLabels = {
        compact: t('dataTable.density.compact'),
        normal: t('dataTable.density.normal'),
        comfortable: t('dataTable.density.comfortable'),
    };
    const { columnVisibility, columnOrder } = state.preferences;
    const hideable = columns.filter((column) => column.hideable !== false && !column.filterOnly);
    if (hideable.length === 0) return null;

    const ordered = columnOrder.flatMap((id) => {
        const column = hideable.find((one) => one.id === id);
        return column ? [column] : [];
    });
    const hiddenCount = hideable.filter((column) => columnVisibility[column.id] === false).length;

    const move = (id: string, delta: -1 | 1) => {
        const target = ordered[ordered.findIndex((one) => one.id === id) + delta];
        if (!target) return;
        const next = [...columnOrder];
        const from = next.indexOf(id);
        const to = next.indexOf(target.id);
        [next[from], next[to]] = [target.id, id];
        state.updatePreferences({ columnOrder: next });
    };

    const reset = () => {
        const { columnVisibility: visibility, columnOrder: order } = defaultPreferences(columns);
        state.updatePreferences({ columnVisibility: visibility, columnOrder: order });
    };

    return (
        <>
            <div ref={anchor} className="inline-flex">
                <Tooltip
                    label={t('dataTable.columns.title')}
                    description={t('dataTable.columns.help')}
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
                        <Columns3 size={16} aria-hidden className="text-primary" />
                        <span className="max-sm:sr-only">{t('dataTable.columns.title')}</span>
                        {hiddenCount > 0 && <Badge variant="primary">{hiddenCount}</Badge>}
                    </Button>
                </Tooltip>
            </div>
            <FloatingPanel
                anchorRef={anchor}
                open={open}
                onClose={close}
                label={t('dataTable.columns.title')}
                width={320}
            >
                <div className="gap-2 p-3 flex flex-col">
                    <p className="text-xs text-muted-foreground">{t('dataTable.columns.help')}</p>
                    <ul>
                        {ordered.map((column, index) => (
                            <li key={column.id} className="gap-1 flex items-center">
                                <div className="min-w-0 flex-1">
                                    <Checkbox
                                        label={column.label}
                                        checked={columnVisibility[column.id] !== false}
                                        onChange={(event) => {
                                            state.updatePreferences({
                                                columnVisibility: {
                                                    ...columnVisibility,
                                                    [column.id]: event.target.checked,
                                                },
                                            });
                                        }}
                                    />
                                </div>
                                <IconAction
                                    tone="primary"
                                    className="h-8 w-8"
                                    disabled={index === 0}
                                    aria-label={t('dataTable.columns.moveUp', {
                                        column: column.label,
                                    })}
                                    onClick={() => {
                                        move(column.id, -1);
                                    }}
                                >
                                    <ChevronUp size={16} aria-hidden />
                                </IconAction>
                                <IconAction
                                    tone="primary"
                                    className="h-8 w-8"
                                    disabled={index === ordered.length - 1}
                                    aria-label={t('dataTable.columns.moveDown', {
                                        column: column.label,
                                    })}
                                    onClick={() => {
                                        move(column.id, 1);
                                    }}
                                >
                                    <ChevronDown size={16} aria-hidden />
                                </IconAction>
                            </li>
                        ))}
                    </ul>
                    <fieldset className="gap-1.5 flex flex-col">
                        <legend className="mb-1 font-semibold text-[11px] tracking-[0.14em] text-muted-foreground uppercase">
                            {t('dataTable.density.title')}
                        </legend>
                        <div className="gap-1.5 flex flex-wrap">
                            {TABLE_DENSITIES.map((density) => (
                                <Chip
                                    key={density}
                                    active={state.preferences.density === density}
                                    onClick={() => {
                                        state.updatePreferences({ density });
                                    }}
                                >
                                    {densityLabels[density]}
                                </Chip>
                            ))}
                        </div>
                    </fieldset>
                    <Button variant="ghost" size="sm" onClick={reset}>
                        {t('dataTable.columns.reset')}
                    </Button>
                </div>
            </FloatingPanel>
        </>
    );
}
