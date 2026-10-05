import type { CustomTableRow, CustomTableWithColumns } from '@navis/shared';
import type { ViewState } from '@/lib/tables/view-state';
import { TableRowList } from './row-list';

/** The web grid's records use a bounded card list on mobile. */
export function TableGrid({
    table,
    state,
    onChange,
    onRow,
}: {
    table: CustomTableWithColumns;
    state: ViewState;
    onChange: (patch: Partial<ViewState>) => void;
    onRow: (row: CustomTableRow) => void;
}) {
    return (
        <TableRowList
            table={table}
            viewId="grid"
            query={state.query}
            hidden={state.hidden}
            onRow={onRow}
            scroll={state.scroll}
            onScroll={(scroll) => onChange({ scroll })}
        />
    );
}
