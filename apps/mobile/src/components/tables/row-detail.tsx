import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { router } from 'expo-router';
import type { CustomTableWithColumns, CustomTableRow, CustomTableView } from '@navis/shared';
import { deleteTableRow, updateTableRow } from '@/data/repos/table-rows';
import { useTableContext, useTableMutation } from '@/hooks/use-tables';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { FieldError } from '@/components/ui/field-error';
import { rowTitle } from '@/lib/tables/format';
import { RowForm } from './row-form';
import { RowDetailFields } from './row-detail-fields';
import { RowEditorFrame } from './row-editor-frame';
import { RowPreviewHeader } from './row-preview-header';
import { ConfirmationSheet } from './confirmation-sheet';

export function RowDetail({
    table,
    row,
    view,
    onClose,
    screen = false,
}: {
    table: CustomTableWithColumns;
    row: CustomTableRow;
    view?: CustomTableView;
    onClose: () => void;
    screen?: boolean;
}) {
    const { t } = useTranslation(),
        { canEditRows } = useTableContext(),
        [editing, setEditing] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const remove = useTableMutation((scope, _: void) => deleteTableRow(scope, table.id, row.id));
    const move = useTableMutation((scope, value: string) =>
        updateTableRow(scope, table.id, row.id, { data: { [view?.groupBy ?? '']: value || null } }),
    );
    const group = table.columns.find((column) => column.key === view?.groupBy);
    if (editing) return <RowForm table={table} row={row} onClose={onClose} screen={screen} />;
    const actions = canEditRows ? (
        <View className="gap-2">
            <Button
                title={t('tables.editRow')}
                leadingIcon="create-outline"
                disabled={remove.isPending || move.isPending}
                onPress={() => setEditing(true)}
            />
            <Button
                title={t('tables.deleteRow')}
                leadingIcon="trash-outline"
                variant="destructive"
                disabled={remove.isPending || move.isPending}
                onPress={() => setConfirmDelete(true)}
            />
        </View>
    ) : null;
    const body = (
        <View className="gap-4 pb-4">
            <RowPreviewHeader table={table} row={row} />
            {row.believer ? (
                <Button
                    variant="secondary"
                    title={row.believer.name}
                    onPress={() => {
                        onClose();
                        router.push({
                            pathname: '/believers/[id]',
                            params: { id: row.believer?.id ?? '' },
                        });
                    }}
                />
            ) : null}
            <RowDetailFields table={table} row={row} />
            {group && canEditRows && (!table.source || !group.believerField) ? (
                <Select
                    label={t('tables.mobile.moveTo')}
                    value={
                        typeof row.data[group.key] === 'string' ? String(row.data[group.key]) : ''
                    }
                    placeholder={t('export.unassigned')}
                    options={[
                        { value: '', label: t('export.unassigned') },
                        ...(group.options ?? []).map((option) => ({
                            value: option.value,
                            label: option.label,
                        })),
                    ]}
                    onChange={(value) =>
                        void move
                            .mutateAsync(value)
                            .then(onClose)
                            .catch(() => undefined)
                    }
                />
            ) : null}
            {remove.isError || move.isError ? <FieldError message={t('errors.generic')} /> : null}
            {!screen ? actions : null}
        </View>
    );
    const confirmation = confirmDelete ? (
        <ConfirmationSheet
            title={t('tables.deleteRow')}
            subject={rowTitle(table.columns, row)}
            description={t('tables.deleteRowExplain')}
            confirmLabel={t('common.delete')}
            busy={remove.isPending}
            failed={remove.isError}
            onCancel={() => setConfirmDelete(false)}
            onConfirm={() =>
                void remove
                    .mutateAsync()
                    .then(onClose)
                    .catch(() => undefined)
            }
        />
    ) : null;
    const title = rowTitle(table.columns, row);
    return screen ? (
        <RowEditorFrame title={table.name} onClose={onClose} footer={actions}>
            {body}
            {confirmation}
        </RowEditorFrame>
    ) : (
        <BottomSheet visible title={title} onClose={onClose}>
            {body}
            {confirmation}
        </BottomSheet>
    );
}
