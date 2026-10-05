import { FlatList, Text, View, useWindowDimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { CustomTableRow, CustomTableWithColumns, CustomTableView } from '@navis/shared';
import type { ViewState } from '@/lib/tables/view-state';
import { TableRowList } from './row-list';
import { useTableRows } from '@/hooks/use-tables';

function Lane({
    table,
    view,
    state,
    value,
    label,
    onRow,
    onChange,
}: {
    table: CustomTableWithColumns;
    view: CustomTableView;
    state: ViewState;
    value: string | null;
    label: string;
    onRow: (row: CustomTableRow) => void;
    onChange: (patch: Partial<ViewState>) => void;
}) {
    const query = { ...state.query, lane: { key: view.groupBy ?? '', value } };
    const rows = useTableRows(table.id, view.id, query);
    return (
        <View className="flex-1 rounded-xl border border-border bg-muted/30">
            <Text className="p-4 font-sans-semibold text-foreground">
                {label + ' · ' + (rows.data?.pages[0]?.total ?? '…')}
            </Text>
            <TableRowList
                table={table}
                viewId={view.id}
                query={query}
                hidden={state.hidden}
                onRow={onRow}
                scroll={state.laneScroll?.[value ?? 'unassigned'] ?? 0}
                onScroll={(scroll) =>
                    onChange({
                        laneScroll: { ...state.laneScroll, [value ?? 'unassigned']: scroll },
                    })
                }
            />
        </View>
    );
}
export function TableKanban({
    table,
    view,
    state,
    onChange,
    onRow,
}: {
    table: CustomTableWithColumns;
    view: CustomTableView;
    state: ViewState;
    onChange: (patch: Partial<ViewState>) => void;
    onRow: (row: CustomTableRow) => void;
}) {
    const { t } = useTranslation(),
        { width } = useWindowDimensions();
    const column = table.columns.find(
        (one) => one.key === view.groupBy && one.type === 'single_select',
    );
    const lanes = [
        ...(column?.options?.map((option) => ({ value: option.value, label: option.label })) ?? []),
        { value: null, label: t('export.unassigned') },
    ];
    const laneWidth = Math.min(420, width * 0.84);
    if (!column)
        return (
            <Text className="p-4 font-sans text-muted-foreground">
                {t('tables.mobile.viewUnavailable')}
            </Text>
        );
    return (
        <FlatList
            horizontal
            data={lanes}
            keyExtractor={(lane) => lane.value ?? 'unassigned'}
            initialScrollIndex={Math.min(state.lane, lanes.length - 1)}
            getItemLayout={(_, index) => ({
                length: laneWidth + 12,
                offset: (laneWidth + 12) * index,
                index,
            })}
            initialNumToRender={2}
            maxToRenderPerBatch={2}
            windowSize={3}
            snapToInterval={laneWidth + 12}
            decelerationRate="fast"
            onMomentumScrollEnd={(event) =>
                onChange({ lane: Math.round(event.nativeEvent.contentOffset.x / (laneWidth + 12)) })
            }
            contentContainerStyle={{ padding: 12, gap: 12 }}
            renderItem={({ item, index }) => (
                <View style={{ width: laneWidth }}>
                    {Math.abs(index - state.lane) <= 1 ? (
                        <Lane
                            table={table}
                            view={view}
                            state={state}
                            value={item.value}
                            label={item.label}
                            onRow={onRow}
                            onChange={onChange}
                        />
                    ) : null}
                </View>
            )}
        />
    );
}
