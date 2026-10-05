import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import type { CustomTableWithColumns, CustomTableRow, RowData } from '@navis/shared';
import { createTableRow, updateTableRow } from '@/data/repos/table-rows';
import { useTableMutation } from '@/hooks/use-tables';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { FieldError } from '@/components/ui/field-error';
import { RowFormFields } from './row-form-fields';
import { RowEditorFrame } from './row-editor-frame';
import { ConfirmationSheet } from './confirmation-sheet';

export function RowForm({
    table,
    row,
    initial = {},
    onClose,
    screen = false,
}: {
    table: CustomTableWithColumns;
    row?: CustomTableRow;
    initial?: RowData;
    onClose: () => void;
    screen?: boolean;
}) {
    const { t } = useTranslation(),
        [patch, setPatch] = useState<RowData>(initial);
    const [saved, setSaved] = useState(false);
    const [confirmDiscard, setConfirmDiscard] = useState(false);
    useEffect(() => {
        if (saved) onClose();
    }, [saved, onClose]);
    const save = useTableMutation((context, _: void) =>
        row
            ? updateTableRow(context, table.id, row.id, { data: patch })
            : createTableRow(context, table.id, { data: patch }),
    );
    function close() {
        if (save.isPending) return;
        if (screen) return onClose();
        if (!Object.keys(patch).length) return onClose();
        setConfirmDiscard(true);
    }
    const body = (
        <View className="gap-4 pb-4">
            <RowFormFields
                table={table}
                row={row}
                patch={patch}
                onChange={(key, value) => setPatch((current) => ({ ...current, [key]: value }))}
            />
            {save.isError ? <FieldError message={t('tables.saveFailed')} /> : null}
            <Button
                title={t('common.save')}
                size="lg"
                loading={save.isPending}
                onPress={() =>
                    void save
                        .mutateAsync()
                        .then(() => setSaved(true))
                        .catch(() => undefined)
                }
            />
        </View>
    );
    const title = t(row ? 'tables.editRow' : 'tables.newRow');
    if (confirmDiscard)
        return (
            <ConfirmationSheet
                title={t('tables.mobile.discard')}
                confirmLabel={t('tables.mobile.discard')}
                onCancel={() => setConfirmDiscard(false)}
                onConfirm={onClose}
            />
        );
    return screen ? (
        <RowEditorFrame
            title={title}
            dirty={!saved && Object.keys(patch).length > 0}
            onClose={close}
        >
            {body}
        </RowEditorFrame>
    ) : (
        <BottomSheet visible title={title} onClose={close}>
            {body}
        </BottomSheet>
    );
}
