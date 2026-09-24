import { useTableRows, useUpdateTableView } from '@navis/api-client';
import {
    addMonths,
    eachDay,
    monthGrid,
    MAX_PAGE_SIZE,
    type CustomTableColumn,
    type CustomTableRow,
    type CustomTableView,
    type RowFilter,
} from '@navis/shared';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ActiveFiltersRow } from '@/components/tables/active-filters-row';
import { FilterMenu } from '@/components/tables/filter-menu';
import { RowForm } from '@/components/tables/row-form';
import { TableCalendarDay } from '@/components/tables/table-calendar-day';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { monthTitle, weekdayHeadings } from '@/lib/calendar/labels';
import { todayIso } from '@/lib/calendar/params';
import { announceFilterChange } from '@/lib/tables/filter-announce';
import { encodeFilters } from '@/lib/tables/filters';
import { toast } from '@/lib/toast';

/**
 * El calendario (RFC 0021 D27): solo pide el mes visible, con el mismo rango
 * que ya resuelve `monthGrid` para el calendario de programaciones.
 *
 * Los filtros de la vista (D24) viajan con el rango del mes, y aquí se
 * afinan: cambiarlos marca la vista como sucia y «Actualizar vista» guarda el
 * cambio (D5). Se monta con `key={view.id}` para que cada vista arranque con
 * los suyos.
 */
export function TableCalendarView({
    tableId,
    view,
    columns,
    editable,
    canManage,
}: {
    tableId: string;
    view: CustomTableView;
    columns: readonly CustomTableColumn[];
    editable: boolean;
    canManage: boolean;
}) {
    const { t } = useTranslation();
    const updateView = useUpdateTableView(api);
    const [anchor, setAnchor] = useState(todayIso());
    const [editando, setEditando] = useState<{ row?: CustomTableRow; date?: string } | null>(null);
    const [filters, setFilters] = useState<RowFilter[]>(view.filters);
    const [sucia, setSucia] = useState(false);

    const dateColumn = columns.find((one) => one.key === view.dateColumn && one.type === 'date');
    const titleColumn = columns.find(
        (one) => one.key !== view.dateColumn && one.type !== 'password',
    );
    // La columna de fecha no se filtra: el mes en pantalla **es** su filtro.
    const filterables = columns.filter(
        (one) => one.key !== view.dateColumn && one.type !== 'password',
    );
    const range = useMemo(() => monthGrid(anchor), [anchor]);
    const days = useMemo(() => eachDay(range.from, range.to), [range]);

    const setViewFilters = (next: RowFilter[]) => {
        announceFilterChange(filters, next, t);
        setFilters(next);
        setSucia(true);
    };

    const guardar = () => {
        updateView.mutate(
            { tableId, id: view.id, filters },
            {
                onSuccess: () => {
                    setSucia(false);
                    toast.success(t('tables.filters.viewUpdated'));
                },
            },
        );
    };

    const filtersParam = encodeFilters([
        ...filters,
        ...(dateColumn
            ? [{ columnKey: dateColumn.key, operator: 'between' as const, value: range }]
            : []),
    ]);
    const { data } = useTableRows(
        api,
        tableId,
        {
            page: 1,
            limit: MAX_PAGE_SIZE,
            order: 'asc',
            sort: dateColumn?.key,
            filters: filtersParam,
        },
        Boolean(dateColumn),
    );

    const byDay = useMemo(() => {
        const map = new Map<string, CustomTableRow[]>();
        if (!dateColumn) return map;
        for (const row of data?.items ?? []) {
            const value = row.data[dateColumn.key];
            if (typeof value !== 'string') continue;
            const day = value.slice(0, 10);
            map.set(day, [...(map.get(day) ?? []), row]);
        }
        return map;
    }, [data, dateColumn]);

    if (!dateColumn) return null;

    return (
        <div className="gap-3 flex flex-col">
            <div className="gap-2 flex items-center justify-between">
                <div className="gap-2 flex items-center">
                    <Button
                        variant="ghost"
                        size="icon"
                        aria-label={t('common.previous')}
                        onClick={() => {
                            setAnchor((current) => addMonths(current, -1));
                        }}
                    >
                        <ChevronLeft size={16} aria-hidden />
                    </Button>
                    <p className="text-sm font-semibold capitalize">{monthTitle(anchor)}</p>
                    <Button
                        variant="ghost"
                        size="icon"
                        aria-label={t('common.next')}
                        onClick={() => {
                            setAnchor((current) => addMonths(current, 1));
                        }}
                    >
                        <ChevronRight size={16} aria-hidden />
                    </Button>
                </div>

                <div className="gap-2 flex flex-wrap items-center">
                    <FilterMenu columns={filterables} filters={filters} onChange={setViewFilters} />
                    {canManage && sucia && (
                        <Button
                            variant="secondary"
                            size="md"
                            isLoading={updateView.isPending}
                            onClick={guardar}
                        >
                            {t('tables.filters.updateView')}
                        </Button>
                    )}
                </div>
            </div>

            <ActiveFiltersRow columns={filterables} filters={filters} onChange={setViewFilters} />

            <div className="overflow-hidden rounded-xl border">
                <div className="grid grid-cols-7 border-b bg-muted/40">
                    {weekdayHeadings().map((heading) => (
                        <div
                            key={heading.key}
                            className="px-2 py-2 font-semibold text-[11px] tracking-[0.1em] text-muted-foreground uppercase"
                        >
                            {heading.label}
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-7 border-t">
                    {days.map((day) => (
                        <TableCalendarDay
                            key={day}
                            date={day}
                            outside={!day.startsWith(anchor.slice(0, 7))}
                            isToday={day === todayIso()}
                            rows={byDay.get(day) ?? []}
                            titleColumn={titleColumn}
                            editable={editable}
                            onOpenRow={(row) => {
                                setEditando({ row });
                            }}
                            onAddRow={(date) => {
                                setEditando({ date });
                            }}
                        />
                    ))}
                </div>
            </div>

            {editando && (
                <RowForm
                    key={editando.row?.id ?? editando.date}
                    open
                    onClose={() => {
                        setEditando(null);
                    }}
                    tableId={tableId}
                    columns={columns}
                    row={editando.row}
                    initialData={editando.date ? { [dateColumn.key]: editando.date } : undefined}
                />
            )}
        </div>
    );
}
