import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import type {
    CustomTableWithColumns,
    CustomTableView,
    CustomTableRow,
    RowData,
} from '@navis/shared';
import { useTableContext } from '@/hooks/use-tables';
import { useTableViewState } from '@/hooks/use-table-view-state';
import { TableHeader } from './table-header';
import { TableToolbar } from './table-toolbar';
import { TableGrid } from './table-grid';
import { TableKanban } from './table-kanban';
import { TableCalendar } from './table-calendar';
import { TableOverlays, type TablePanel } from './table-overlays';
import { TableFooter } from './table-footer';
import { combineLocalDate } from '@/lib/tables/date-value';

export function TableWorkspace({
    table,
    views,
}: {
    table: CustomTableWithColumns;
    views: CustomTableView[];
}) {
    const scope = useTableContext();
    const controller = useTableViewState(
        `navis.tables:${scope.context.churchId}:${scope.context.userId}:${table.id}`,
        table.columns,
        views,
    );
    const [panel, setPanel] = useState<TablePanel>(null);
    const view = views.find((one) => one.id === controller.active);
    const { active, setActive } = controller;
    useEffect(() => {
        if (active !== 'grid' && !view) setActive('grid');
    }, [active, setActive, view]);
    const openNew = (data: RowData) =>
        router.push({
            pathname: '/tables/[id]/row',
            params: { id: table.id, viewId: controller.active, initial: JSON.stringify(data) },
        });
    const props = {
        table,
        state: controller.state,
        onChange: controller.update,
        onRow: (item: CustomTableRow) =>
            router.push({
                pathname: '/tables/[id]/row',
                params: { id: table.id, rowId: item.id, viewId: controller.active },
            }),
    };
    function create() {
        if (table.source === 'believers') return setPanel('believers');
        const column = table.columns.find(
            (one) => view?.type === 'calendar' && one.key === view.dateColumn,
        );
        const day = controller.state.day;
        openNew(
            column && day
                ? {
                      [column.key]: column.config?.includeTime
                          ? combineLocalDate(day, '12:00')
                          : day,
                  }
                : {},
        );
    }
    return (
        <View className="flex-1 bg-background">
            <TableHeader
                table={table}
                onEdit={scope.canManageStructure ? () => setPanel('settings') : undefined}
            />
            <TableToolbar
                table={table}
                view={view}
                state={controller.state}
                onChange={controller.update}
                canManage={scope.canManageStructure}
                onPanel={setPanel}
            />
            {!view ? (
                <TableGrid {...props} />
            ) : view.type === 'kanban' ? (
                <TableKanban key={view.id} {...props} view={view} />
            ) : (
                <TableCalendar key={view.id} {...props} view={view} />
            )}
            <TableFooter
                linked={table.source === 'believers'}
                onCreate={create}
                onExport={() => setPanel('export')}
            />
            <TableOverlays
                table={table}
                views={views}
                controller={controller}
                panel={panel}
                setPanel={setPanel}
            />
        </View>
    );
}
