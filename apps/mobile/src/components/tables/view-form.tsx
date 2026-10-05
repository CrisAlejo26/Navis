import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import type { CustomTableWithColumns, CustomTableView, RowFilter } from '@navis/shared';
import { createView, updateView } from '@/data/repos/table-views';
import { useTableMutation } from '@/hooks/use-tables';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { TextField } from '@/components/ui/text-field';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { FieldError } from '@/components/ui/field-error';

export function ViewForm({
    table,
    view,
    initialFilters,
    onClose,
}: {
    table: CustomTableWithColumns;
    view?: CustomTableView;
    initialFilters?: RowFilter[];
    onClose: () => void;
}) {
    const { t } = useTranslation(),
        [name, setName] = useState(view?.name ?? ''),
        [type, setType] = useState<'kanban' | 'calendar'>(
            view?.type === 'calendar' ||
                (!view && !table.columns.some((column) => column.type === 'single_select'))
                ? 'calendar'
                : 'kanban',
        );
    const [key, setKey] = useState(
        view?.groupBy ??
            view?.dateColumn ??
            table.columns.find(
                (column) => column.type === (type === 'kanban' ? 'single_select' : 'date'),
            )?.key ??
            '',
    );
    const columns = table.columns.filter(
        (column) => column.type === (type === 'kanban' ? 'single_select' : 'date'),
    );
    const save = useTableMutation((context, _: void) =>
        view
            ? updateView(context, table.id, view.id, { name })
            : createView(context, table.id, {
                  name,
                  type,
                  filters: initialFilters,
                  ...(type === 'kanban' ? { groupBy: key } : { dateColumn: key }),
              }),
    );
    return (
        <BottomSheet
            visible
            onClose={onClose}
            title={t(view ? 'tables.mobile.renameView' : 'tables.newView')}
        >
            <View className="gap-4">
                <TextField
                    label={t('tables.viewName')}
                    value={name}
                    onChangeText={setName}
                    maxLength={60}
                />
                {!view ? (
                    <>
                        {initialFilters?.length ? (
                            <Text className="font-sans text-sm text-muted-foreground">
                                {t('tables.filters.willSave', { count: initialFilters.length })}
                            </Text>
                        ) : null}
                        <Select
                            label={t('tables.viewTypeLabel')}
                            value={type}
                            placeholder={t('tables.viewTypeLabel')}
                            options={[
                                { value: 'kanban', label: t('tables.view.kanban') },
                                { value: 'calendar', label: t('tables.view.calendar') },
                            ].filter((option) =>
                                table.columns.some(
                                    (column) =>
                                        column.type ===
                                        (option.value === 'kanban' ? 'single_select' : 'date'),
                                ),
                            )}
                            onChange={(value) => {
                                setType(value === 'calendar' ? 'calendar' : 'kanban');
                                setKey(
                                    table.columns.find(
                                        (column) =>
                                            column.type ===
                                            (value === 'kanban' ? 'single_select' : 'date'),
                                    )?.key ?? '',
                                );
                            }}
                        />
                        {columns.length ? (
                            <Select
                                label={t(
                                    type === 'kanban'
                                        ? 'tables.groupByColumn'
                                        : 'tables.dateColumnLabel',
                                )}
                                value={key}
                                placeholder={t('tables.columns')}
                                options={columns.map((column) => ({
                                    value: column.key,
                                    label: column.label,
                                }))}
                                onChange={setKey}
                            />
                        ) : (
                            <Text className="font-sans text-muted-foreground">
                                {t(
                                    type === 'kanban'
                                        ? 'tables.noSingleSelectForKanban'
                                        : 'tables.noDateForCalendar',
                                )}
                            </Text>
                        )}
                    </>
                ) : null}
                {save.isError ? <FieldError message={t('tables.saveFailed')} /> : null}
                <Button
                    title={t('common.save')}
                    loading={save.isPending}
                    disabled={!name.trim() || (!view && !key)}
                    onPress={() =>
                        void save
                            .mutateAsync()
                            .then(onClose)
                            .catch(() => undefined)
                    }
                />
            </View>
        </BottomSheet>
    );
}
