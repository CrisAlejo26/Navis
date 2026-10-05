import { todayIn, type CustomTableView, type CustomTableColumn } from '@navis/shared';
import type { TableQuery } from '@/data/repos/table-query';
import { filterSql } from '@/data/repos/table-filter-sql';

export interface ViewState {
    query: TableQuery;
    month: string;
    day: string | null;
    lane: number;
    scroll: number;
    horizontal?: number;
    laneScroll?: Record<string, number>;
    hidden: string[];
    widths: Record<string, number>;
    cards: boolean;
}
export function initialViewState(view?: CustomTableView): ViewState {
    const today = todayIn(Intl.DateTimeFormat().resolvedOptions().timeZone);
    return {
        query: {
            filters: view?.filters ?? [],
            sort: view?.sortBy ?? undefined,
            order: view?.sortOrder ?? 'asc',
        },
        month: today,
        day: today,
        lane: 0,
        scroll: 0,
        hidden: [],
        widths: {},
        cards: true,
    };
}
export function sanitizeState(state: ViewState, columns: CustomTableColumn[]): ViewState {
    const keys = new Set(columns.filter((one) => one.type !== 'password').map((one) => one.key));
    return {
        ...state,
        cards: true,
        query: {
            ...state.query,
            filters: state.query.filters?.filter((filter) => {
                const column = columns.find((one) => one.key === filter.columnKey);
                if (!column || !keys.has(filter.columnKey)) return false;
                try {
                    filterSql(column, 'value', filter);
                    return true;
                } catch {
                    return false;
                }
            }),
            sort: state.query.sort && keys.has(state.query.sort) ? state.query.sort : undefined,
        },
        hidden: state.hidden.filter((key) => columns.some((column) => column.key === key)),
        widths: Object.fromEntries(
            Object.entries(state.widths)
                .filter(([key]) => columns.some((column) => column.key === key))
                .map(([key, width]) => [key, Math.max(72, Math.min(360, width))]),
        ),
    };
}
