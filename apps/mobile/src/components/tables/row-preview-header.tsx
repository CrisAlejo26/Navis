import type { CustomTableWithColumns, CustomTableRow } from '@navis/shared';
import { accentHex } from '@navis/theme';
import { Text, View } from 'react-native';
import { Icon } from '@/components/ui/icon';
import { tableIcons } from '@/lib/tables/icons';
import { rowTitle } from '@/lib/tables/format';
import { hexAlpha } from '@/lib/color';
import { useThemeStore } from '@/lib/theme';
import { RowValue } from './row-value';

export function RowPreviewHeader({
    table,
    row,
}: {
    table: CustomTableWithColumns;
    row: CustomTableRow;
}) {
    const theme = useThemeStore((state) => state.resolvedTheme);
    const color = accentHex(table.accent, theme);
    const status = table.columns.find(
        (column) => column.type === 'single_select' && row.data[column.key],
    );
    return (
        <View
            className="p-5 gap-4"
            style={{
                borderRadius: 26,
                backgroundColor: hexAlpha(color, theme === 'dark' ? 0.14 : 0.06),
            }}
        >
            <View className="gap-3 flex-row items-center">
                <View
                    className="items-center justify-center"
                    style={{
                        width: 52,
                        height: 52,
                        borderRadius: 18,
                        backgroundColor: hexAlpha(color, 0.14),
                    }}
                >
                    <Icon name={tableIcons[table.icon] ?? 'grid-outline'} size="lg" color={color} />
                </View>
                <Text className="font-sans-medium text-sm flex-1 text-muted-foreground">
                    {table.name}
                </Text>
            </View>
            <Text
                accessibilityRole="header"
                className="font-sans-bold text-3xl leading-9 text-foreground"
            >
                {rowTitle(table.columns, row)}
            </Text>
            {status ? <RowValue column={status} value={row.data[status.key]} /> : null}
        </View>
    );
}
