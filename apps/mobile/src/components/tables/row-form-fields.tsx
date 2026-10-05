import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import type { CustomTableWithColumns, CustomTableRow, RowData } from '@navis/shared';
import { RowField } from './fields/row-field';
import { formatCell } from '@/lib/tables/format';
export function RowFormFields({
    table,
    row,
    patch,
    onChange,
}: {
    table: CustomTableWithColumns;
    row?: CustomTableRow;
    patch: RowData;
    onChange: (key: string, value: unknown) => void;
}) {
    const { t } = useTranslation();
    return (
        <>
            {table.columns.map((column) =>
                table.source === 'believers' && column.believerField ? (
                    <Text key={column.id} className="font-sans text-muted-foreground">
                        {column.label +
                            ': ' +
                            formatCell(column, row?.data[column.key]) +
                            '\n' +
                            t('tables.boundCellHint')}
                    </Text>
                ) : (
                    <View key={column.id} className="gap-2">
                        {row?.mismatches.includes(column.key) ? (
                            <Text className="font-sans text-warning">
                                {t('tables.mobile.incompatible') +
                                    ': ' +
                                    formatCell(column, row.data[column.key])}
                            </Text>
                        ) : null}
                        <View className="gap-2 flex-row items-start">
                            <View className="flex-1">
                                <RowField
                                    column={column}
                                    value={
                                        Object.hasOwn(patch, column.key)
                                            ? patch[column.key]
                                            : column.type === 'password'
                                              ? ''
                                              : row?.data[column.key]
                                    }
                                    onChange={(value) => onChange(column.key, value)}
                                />
                            </View>
                        </View>
                    </View>
                ),
            )}
        </>
    );
}
