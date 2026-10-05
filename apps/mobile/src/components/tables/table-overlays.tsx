import type { CustomTableWithColumns, CustomTableView } from '@navis/shared';
import type { useTableViewState } from '@/hooks/use-table-view-state';
import { useTableContext } from '@/hooks/use-tables';
import { TableSettings } from './table-settings';
import { ViewsSheet } from './views-sheet';
import { QuerySheet } from './query-sheet';
import { PresentationSheet } from './presentation-sheet';
import { BelieversPicker } from './believers-picker';
import { TableExport } from './table-export';

export type TablePanel =
    'settings' | 'views' | 'query' | 'presentation' | 'believers' | 'export' | null;
export function TableOverlays({
    table,
    views,
    controller,
    panel,
    setPanel,
}: {
    table: CustomTableWithColumns;
    views: CustomTableView[];
    controller: ReturnType<typeof useTableViewState>;
    panel: TablePanel;
    setPanel: (panel: TablePanel) => void;
}) {
    const { canManageStructure } = useTableContext();
    const close = () => setPanel(null);
    switch (panel) {
        case 'settings':
            return <TableSettings table={table} onClose={close} />;
        case 'views':
            return (
                <ViewsSheet
                    table={table}
                    views={views}
                    active={controller.active}
                    initialFilters={controller.state.query.filters}
                    canManage={canManageStructure}
                    onSelect={(id) => {
                        controller.setActive(id);
                        close();
                    }}
                    onRemove={controller.remove}
                    onClose={close}
                />
            );
        case 'query':
            return (
                <QuerySheet
                    table={table}
                    query={controller.state.query}
                    onChange={(query) => controller.update({ query, scroll: 0 })}
                    onClose={close}
                />
            );
        case 'presentation':
            return (
                <PresentationSheet
                    table={table}
                    state={controller.state}
                    onChange={controller.update}
                    onClose={close}
                />
            );
        case 'believers':
            return <BelieversPicker id={table.id} onClose={close} />;
        case 'export':
            return <TableExport table={table} query={controller.state.query} onClose={close} />;
        default:
            return null;
    }
}
