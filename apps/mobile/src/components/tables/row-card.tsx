import type { CustomTableColumn, CustomTableRow, CustomTableWithColumns } from '@navis/shared';
import { accentHex } from '@navis/theme';
import { Pressable, Text, View } from 'react-native';
import { Icon } from '@/components/ui/icon';
import { rowTitle, formatCell } from '@/lib/tables/format';
import { tableIcons } from '@/lib/tables/icons';
import { Card } from '@/components/ui/card';
import { useThemeStore } from '@/lib/theme';
import { hexAlpha } from '@/lib/color';
import { RowValue, fieldIcons } from './row-value';

export function RowCard({
    table,
    row,
    columns,
    onPress,
}: {
    table: CustomTableWithColumns;
    row: CustomTableRow;
    columns: CustomTableColumn[];
    onPress: () => void;
}) {
    const theme = useThemeStore((state) => state.resolvedTheme);
    const color = accentHex(table.accent, theme);
    const title = rowTitle(columns, row);
    const filled = columns
        .slice(1)
        .filter((column) => row.data[column.key] != null && row.data[column.key] !== '');
    const subtitle = filled.find((column) => column.type === 'long_text' || column.type === 'text');
    const status = filled.find((column) => column.type === 'single_select');
    const metadata = filled
        .filter(
            (column) => column !== subtitle && column !== status && column.type !== 'multi_select',
        )
        .slice(0, 2);
    return (
        <Pressable
            accessibilityRole="button"
            accessibilityLabel={title}
            onPress={onPress}
            className="active:opacity-80"
        >
            <Card className="gap-4 rounded-[26px]">
                <View className="gap-3 flex-row items-start">
                    <View
                        className="items-center justify-center"
                        style={{
                            width: 44,
                            height: 44,
                            borderRadius: 16,
                            backgroundColor: hexAlpha(color, 0.12),
                        }}
                    >
                        <Icon name={tableIcons[table.icon] ?? 'grid-outline'} color={color} />
                    </View>
                    <View className="gap-1 min-w-0 flex-1">
                        <Text
                            className="font-sans-semibold text-base leading-6 text-foreground"
                            numberOfLines={2}
                        >
                            {title}
                        </Text>
                        {subtitle ? (
                            <Text
                                className="font-sans text-sm leading-5 text-muted-foreground"
                                numberOfLines={2}
                            >
                                {formatCell(subtitle, row.data[subtitle.key])}
                            </Text>
                        ) : null}
                    </View>
                    <Icon name="chevron-forward" size="sm" />
                </View>
                {status ? <RowValue column={status} value={row.data[status.key]} compact /> : null}
                {metadata.length ? (
                    <View className="gap-4 pt-3 flex-row border-t border-border">
                        {metadata.map((column) => (
                            <View key={column.id} className="gap-1 min-w-0 flex-1">
                                <View className="gap-1.5 flex-row items-center">
                                    <Icon name={fieldIcons[column.type]} size="sm" />
                                    <Text
                                        className="font-sans text-xs flex-1 text-muted-foreground"
                                        numberOfLines={1}
                                    >
                                        {column.label}
                                    </Text>
                                </View>
                                <RowValue column={column} value={row.data[column.key]} compact />
                            </View>
                        ))}
                    </View>
                ) : null}
            </Card>
        </Pressable>
    );
}
