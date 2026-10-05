import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import type { CustomTableWithColumns, CustomTableColumn } from '@navis/shared';
import { deleteColumn, reorderColumns } from '@/data/repos/table-columns';
import { useTableMutation } from '@/hooks/use-tables';
import { ConfirmationSheet } from './confirmation-sheet';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { IconButton } from '@/components/ui/icon-button';
import { FieldError } from '@/components/ui/field-error';
import { ColumnForm } from './column-form';
import { columnLabels } from './column-labels';

export function ColumnsManager({
    table,
    onClose,
}: {
    table: CustomTableWithColumns;
    onClose: () => void;
}) {
    const { t } = useTranslation(),
        [editing, setEditing] = useState<CustomTableColumn | 'new' | null>(null);
    const [deleting, setDeleting] = useState<CustomTableColumn | null>(null);
    const remove = useTableMutation((context, id: string) => deleteColumn(context, table.id, id));
    const reorder = useTableMutation((context, ids: string[]) =>
        reorderColumns(context, table.id, ids),
    );
    function move(index: number, delta: number) {
        const ids = table.columns.map((column) => column.id),
            next = index + delta;
        if (next < 0 || next >= ids.length) return;
        [ids[index], ids[next]] = [ids[next], ids[index]];
        reorder.mutate(ids);
    }
    if (deleting)
        return (
            <ConfirmationSheet
                title={t('tables.deleteColumn')}
                subject={deleting.label}
                description={t('tables.deleteColumnExplain')}
                confirmLabel={t('common.delete')}
                busy={remove.isPending}
                failed={remove.isError}
                onCancel={() => setDeleting(null)}
                onConfirm={() =>
                    void remove
                        .mutateAsync(deleting.id)
                        .then(() => setDeleting(null))
                        .catch(() => undefined)
                }
            />
        );
    if (editing)
        return (
            <ColumnForm
                table={table}
                column={editing === 'new' ? undefined : editing}
                onClose={() => setEditing(null)}
            />
        );
    return (
        <BottomSheet visible title={t('tables.columns')} onClose={onClose}>
            <View className="gap-3">
                {table.columns.map((column, index) => (
                    <View key={column.id} className="p-3 gap-2 rounded-xl border border-border">
                        <View className="gap-2 flex-row items-center">
                            <View className="gap-1 flex-1">
                                <Text className="font-sans-semibold text-foreground">
                                    {column.label}
                                </Text>
                                <Text className="font-sans text-xs text-muted-foreground">
                                    {t(columnLabels[column.type])}
                                    {column.believerField ? ' � ' + t('tables.boundCellHint') : ''}
                                </Text>
                            </View>
                            <IconButton
                                size="lg"
                                icon="pencil-outline"
                                accessibilityLabel={t('tables.editColumn') + ': ' + column.label}
                                onPress={() => setEditing(column)}
                            />
                        </View>
                        <View className="gap-2 flex-row items-center justify-end">
                            <IconButton
                                size="lg"
                                icon="arrow-up"
                                accessibilityLabel={t('tables.moveUp') + ': ' + column.label}
                                disabled={index === 0 || reorder.isPending}
                                onPress={() => move(index, -1)}
                            />
                            <IconButton
                                size="lg"
                                icon="arrow-down"
                                accessibilityLabel={t('tables.moveDown') + ': ' + column.label}
                                disabled={index === table.columns.length - 1 || reorder.isPending}
                                onPress={() => move(index, 1)}
                            />
                            <IconButton
                                size="lg"
                                icon="trash-outline"
                                accessibilityLabel={t('tables.deleteColumn') + ': ' + column.label}
                                onPress={() => setDeleting(column)}
                            />
                        </View>
                    </View>
                ))}
                {remove.isError || reorder.isError ? (
                    <FieldError message={t('tables.saveFailed')} />
                ) : null}
                <Button
                    title={t('tables.newColumn')}
                    disabled={table.columns.length >= 30}
                    onPress={() => setEditing('new')}
                />
            </View>
        </BottomSheet>
    );
}
