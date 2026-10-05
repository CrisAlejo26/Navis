import { FlatList, Text, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { CustomTableRow, CustomTableWithColumns } from '@navis/shared';
import { useTableRows } from '@/hooks/use-tables';
import type { TableQuery } from '@/data/repos/table-query';
import { Button } from '@/components/ui/button';
import { RowCard } from './row-card';

export function TableRowList({
    table,
    viewId,
    query,
    onRow,
    header,
    scroll = 0,
    onScroll,
    hidden = [],
}: {
    table: CustomTableWithColumns;
    viewId: string;
    query: TableQuery;
    onRow: (row: CustomTableRow) => void;
    header?: React.ReactElement;
    scroll?: number;
    onScroll?: (value: number) => void;
    hidden?: string[];
}) {
    const { t } = useTranslation(),
        rows = useTableRows(table.id, viewId, query);
    const columns = table.columns.filter(
        (column) => !hidden.includes(column.key) && column.type !== 'password',
    );
    return (
        <FlatList
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            style={{ flex: 1, width: '100%' }}
            data={rows.data?.pages.flatMap((page) => page.items) ?? []}
            keyExtractor={(row) => row.id}
            contentOffset={{ x: 0, y: scroll }}
            onScroll={(event) => onScroll?.(event.nativeEvent.contentOffset.y)}
            scrollEventThrottle={100}
            ListHeaderComponent={header}
            contentContainerStyle={{ padding: 16, gap: 12 }}
            renderItem={({ item }) => (
                <RowCard table={table} row={item} columns={columns} onPress={() => onRow(item)} />
            )}
            ListEmptyComponent={
                rows.isPending ? (
                    <ActivityIndicator />
                ) : (
                    <Text className="p-4 font-sans text-muted-foreground">
                        {t(rows.isError ? 'errors.generic' : 'tables.noRowsMatch')}
                    </Text>
                )
            }
            ListFooterComponent={
                rows.isError ? (
                    <Button title={t('common.retry')} onPress={() => void rows.refetch()} />
                ) : rows.hasNextPage ? (
                    <Button
                        title={t('tables.loadMore')}
                        loading={rows.isFetchingNextPage}
                        onPress={() => void rows.fetchNextPage()}
                    />
                ) : null
            }
        />
    );
}
