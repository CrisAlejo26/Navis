import { useState } from 'react';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import type { CustomTableWithColumns } from '@navis/shared';
import { updateTable, deleteTable } from '@/data/repos/tables-writes';
import { useTableMutation } from '@/hooks/use-tables';
import { ConfirmationSheet } from './confirmation-sheet';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { FieldError } from '@/components/ui/field-error';
import { TableForm } from './table-form';
import { ColumnsManager } from './columns-manager';

export function TableSettings({
    table,
    onClose,
}: {
    table: CustomTableWithColumns;
    onClose: () => void;
}) {
    const { t } = useTranslation(),
        [panel, setPanel] = useState<'identity' | 'columns' | null>(null);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const update = useTableMutation((scope, input: Parameters<typeof updateTable>[2]) =>
        updateTable(scope, table.id, input),
    );
    const remove = useTableMutation((scope, _: void) => deleteTable(scope, table.id));
    if (confirmDelete)
        return (
            <ConfirmationSheet
                title={t('tables.delete')}
                subject={table.name}
                description={t('tables.deleteExplain')}
                confirmLabel={t('common.delete')}
                busy={remove.isPending}
                failed={remove.isError}
                onCancel={() => setConfirmDelete(false)}
                onConfirm={() =>
                    void remove
                        .mutateAsync()
                        .then(() => {
                            onClose();
                            router.replace('/tables');
                        })
                        .catch(() => undefined)
                }
            />
        );
    if (panel === 'identity')
        return (
            <TableForm
                table={table}
                onClose={() => setPanel(null)}
                onSave={(input) => update.mutateAsync(input)}
            />
        );
    if (panel === 'columns') return <ColumnsManager table={table} onClose={() => setPanel(null)} />;
    return (
        <BottomSheet visible onClose={onClose} title={t('tables.edit')}>
            <View className="gap-4">
                <Button
                    variant="secondary"
                    title={t('tables.edit')}
                    onPress={() => setPanel('identity')}
                />
                <Button
                    variant="secondary"
                    title={t('tables.mobile.manageColumns')}
                    onPress={() => setPanel('columns')}
                />
                <Switch
                    label={t('tables.mobile.active')}
                    checked={table.isActive}
                    disabled={update.isPending}
                    onChange={(isActive) => update.mutate({ isActive })}
                />
                <Switch
                    label={t('tables.linkBelievers')}
                    description={t('tables.linkBelieversHint')}
                    checked={table.source === 'believers'}
                    disabled={update.isPending}
                    onChange={(linked) => update.mutate({ source: linked ? 'believers' : null })}
                />
                {update.isError || remove.isError ? (
                    <FieldError message={t('tables.saveFailed')} />
                ) : null}
                <Button
                    variant="link"
                    title={t('tables.delete')}
                    onPress={() => setConfirmDelete(true)}
                />
            </View>
        </BottomSheet>
    );
}
