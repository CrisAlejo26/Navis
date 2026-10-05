import { Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { CustomTableColumn, CustomTableRow } from '@navis/shared';
import { formatCell } from '@/lib/tables/format';
import type { ViewState } from '@/lib/tables/view-state';
import { Icon } from '@/components/ui/icon';

type Columns = { columns: CustomTableColumn[]; widths: number[] };
export function GridHeader({
    columns,
    widths,
    state,
    onChange,
}: Columns & {
    state: ViewState;
    onChange: (patch: Partial<ViewState>) => void;
}) {
    const { t } = useTranslation();
    return (
        <View className="flex-row border-b border-border bg-muted">
            {columns.map((column, index) => (
                <Pressable
                    key={column.id}
                    accessibilityRole={column.type === 'password' ? 'text' : 'button'}
                    accessibilityLabel={
                        column.type === 'password'
                            ? column.label
                            : t('dataTable.sortBy', { column: column.label })
                    }
                    onPress={() =>
                        column.type !== 'password' &&
                        onChange({
                            query: {
                                ...state.query,
                                sort: column.key,
                                order:
                                    state.query.sort === column.key && state.query.order === 'asc'
                                        ? 'desc'
                                        : 'asc',
                            },
                            scroll: 0,
                        })
                    }
                    style={{ width: widths[index], minHeight: 52 }}
                    className="px-3 py-3 justify-center border-r border-border"
                >
                    <View className="gap-2 flex-row items-center">
                        <Text className="font-sans-semibold flex-1 text-foreground">
                            {column.label}
                        </Text>
                        {state.query.sort === column.key ? (
                            <Icon
                                name={state.query.order === 'desc' ? 'arrow-down' : 'arrow-up'}
                                size="sm"
                            />
                        ) : null}
                    </View>
                </Pressable>
            ))}
        </View>
    );
}
export function GridRow({
    columns,
    widths,
    row,
    onPress,
}: Columns & { row: CustomTableRow; onPress: () => void }) {
    return (
        <Pressable
            accessibilityRole="button"
            accessibilityLabel={columns
                .map((column) => column.label + ': ' + formatCell(column, row.data[column.key]))
                .join(', ')}
            onPress={onPress}
            className="flex-row border-b border-border bg-background active:bg-muted"
        >
            {columns.map((column, index) => (
                <View
                    key={column.id}
                    style={{ width: widths[index], minHeight: 52 }}
                    className="px-3 py-3 justify-center border-r border-border"
                >
                    <Text className="font-sans text-foreground" numberOfLines={3}>
                        {formatCell(column, row.data[column.key])}
                    </Text>
                </View>
            ))}
        </Pressable>
    );
}
