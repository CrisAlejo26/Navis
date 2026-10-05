import {
    TABLE_COLUMN_TYPES,
    believerFieldMatchesType,
    isTableBelieverField,
    type CustomTableColumn,
    type CustomTableWithColumns,
} from '@navis/shared';
import { useTranslation } from 'react-i18next';
import { View, Text } from 'react-native';
import { useColumnForm } from '@/hooks/use-column-form';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { TextField } from '@/components/ui/text-field';
import { Select } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { FieldError } from '@/components/ui/field-error';
import { columnLabels } from './column-labels';
import { ColumnOptions } from './column-options';
import { ColumnConfigFields } from './column-config-fields';

export function ColumnForm({
    table,
    column,
    onClose,
}: {
    table: CustomTableWithColumns;
    column?: CustomTableColumn;
    onClose: () => void;
}) {
    const { t } = useTranslation(),
        form = useColumnForm(table, column);
    return (
        <BottomSheet
            visible
            onClose={() => {
                if (!form.save.isPending) onClose();
            }}
            title={t(column ? 'tables.editColumn' : 'tables.newColumn')}
        >
            <View className="gap-4 pb-4">
                <TextField
                    label={t('tables.columnName')}
                    value={form.label}
                    onChangeText={form.setLabel}
                    maxLength={80}
                />
                <Select
                    label={t('tables.columnTypeLabel')}
                    placeholder={t('tables.columnTypeLabel')}
                    value={form.type}
                    options={TABLE_COLUMN_TYPES.map((value) => ({
                        value,
                        label: t(columnLabels[value]),
                    }))}
                    onChange={(value) => {
                        form.setType(value);
                        if (
                            isTableBelieverField(form.bound) &&
                            !believerFieldMatchesType(form.bound, value)
                        )
                            form.setBound('manual');
                    }}
                />
                {column && table.source !== 'believers' ? (
                    <Text className="font-sans text-muted-foreground">
                        {t('tables.typeChangeHint')}
                    </Text>
                ) : null}
                <Checkbox
                    label={t('tables.columnRequired')}
                    checked={form.required}
                    onChange={form.setRequired}
                />
                {form.type === 'single_select' || form.type === 'multi_select' ? (
                    <ColumnOptions options={form.options} onChange={form.setOptions} />
                ) : null}
                <ColumnConfigFields form={form} linked={table.source === 'believers'} />
                {form.save.isError ? <FieldError message={t('tables.saveFailed')} /> : null}
                <Button
                    title={t('common.save')}
                    loading={form.save.isPending}
                    onPress={() =>
                        void form.save
                            .mutateAsync()
                            .then(onClose)
                            .catch(() => undefined)
                    }
                />
            </View>
        </BottomSheet>
    );
}
