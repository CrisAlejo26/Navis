import {
    monthGrid,
    type CustomTableRow,
    type CustomTableWithColumns,
    type CustomTableView,
} from '@navis/shared';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import { tablesKey, useTableContext } from '@/hooks/use-tables';
import { readCalendarCounts } from '@/data/repos/table-rows-read';
import type { ViewState } from '@/lib/tables/view-state';
import { TableRowList } from './row-list';
import { CalendarHeader } from './calendar-header';

export function TableCalendar({
    table,
    view,
    state,
    onChange,
    onRow,
    onCreate,
}: {
    table: CustomTableWithColumns;
    view: CustomTableView;
    state: ViewState;
    onChange: (patch: Partial<ViewState>) => void;
    onRow: (row: CustomTableRow) => void;
    onCreate?: (data: Record<string, unknown>) => void;
}) {
    const { t } = useTranslation(),
        { context } = useTableContext(),
        range = monthGrid(state.month);
    const column = table.columns.find((one) => one.key === view.dateColumn && one.type === 'date');
    const counts = useQuery({
        queryKey: [...tablesKey(context), table.id, view.id, 'counts', state.query, range],
        queryFn: () =>
            readCalendarCounts(
                context,
                table.id,
                state.query,
                view.dateColumn ?? '',
                range.from,
                range.to,
            ),
        enabled: Boolean(column),
    });
    if (!column)
        return (
            <View className="p-4 flex-1">
                <Text className="font-sans text-muted-foreground">
                    {t('tables.mobile.viewUnavailable')}
                </Text>
            </View>
        );
    return (
        <TableRowList
            key={state.day ?? 'undated'}
            table={table}
            viewId={view.id}
            hidden={state.hidden}
            query={{ ...state.query, day: { key: column.key, value: state.day } }}
            onRow={onRow}
            scroll={state.scroll}
            onScroll={(scroll) => onChange({ scroll })}
            header={
                <CalendarHeader
                    column={column}
                    state={state}
                    onChange={onChange}
                    counts={counts.data}
                    failed={counts.isError}
                    onRetry={() => void counts.refetch()}
                    onCreate={onCreate}
                />
            }
        />
    );
}
